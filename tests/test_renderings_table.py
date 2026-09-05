import math
import pytest
from lectrace.renderings import flush, table, _cell


# ── helpers ──────────────────────────────────────────────────────────────────

def _table(*args, **kwargs):
    table(*args, **kwargs)
    return flush()[0]


# ── list[dict] ───────────────────────────────────────────────────────────────

def test_dict_rows_infers_headers():
    r = _table([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
    assert r.data["headers"] == ["a", "b"]
    assert r.data["rows"] == [[1, 2], [3, 4]]


def test_dict_rows_headers_override_order():
    r = _table([{"a": 1, "b": 2, "c": 3}], headers=["c", "a"])
    assert r.data["headers"] == ["c", "a"]
    assert r.data["rows"] == [[3, 1]]


def test_dict_rows_sparse_keys_fill_none():
    r = _table([{"a": 1}, {"a": 2, "b": 9}])
    assert r.data["headers"] == ["a", "b"]
    assert r.data["rows"] == [[1, None], [2, 9]]


def test_dict_rows_union_of_all_keys():
    r = _table([{"x": 1}, {"y": 2}, {"x": 3, "y": 4}])
    assert set(r.data["headers"]) == {"x", "y"}


# ── list[list] ───────────────────────────────────────────────────────────────

def test_list_rows_with_headers():
    r = _table([[1, "a"], [2, "b"]], headers=["id", "label"])
    assert r.data["headers"] == ["id", "label"]
    assert r.data["rows"] == [[1, "a"], [2, "b"]]


def test_list_rows_without_headers_raises():
    with pytest.raises(ValueError, match="headers="):
        table([[1, 2], [3, 4]])


# ── empty rows ────────────────────────────────────────────────────────────────

def test_empty_rows():
    r = _table([], headers=["col1", "col2"])
    assert r.data["headers"] == ["col1", "col2"]
    assert r.data["rows"] == []


def test_empty_dict_rows():
    r = _table([])
    assert r.data["headers"] == []
    assert r.data["rows"] == []


# ── caption & style ───────────────────────────────────────────────────────────

def test_caption_included():
    r = _table([{"x": 1}], caption="My caption")
    assert r.data["caption"] == "My caption"


def test_no_caption_key_when_absent():
    r = _table([{"x": 1}])
    assert "caption" not in r.data


def test_style_forwarded():
    r = _table([{"x": 1}], style={"maxWidth": "600px"})
    assert r.style == {"maxWidth": "600px"}


def test_rendering_type():
    r = _table([{"x": 1}])
    assert r.type == "table"


# ── wrong input type ──────────────────────────────────────────────────────────

def test_wrong_element_type_raises():
    with pytest.raises(TypeError, match=r"list\[dict\]"):
        table(["not", "dicts"])


# ── _cell() type normalisation ────────────────────────────────────────────────

def test_cell_none():
    assert _cell(None) is None

def test_cell_bool_true():
    assert _cell(True) is True
    assert isinstance(_cell(True), bool)

def test_cell_bool_false():
    assert _cell(False) is False

def test_cell_int():
    v = _cell(42)
    assert v == 42 and isinstance(v, int)

def test_cell_bool_not_confused_with_int():
    # bool is a subclass of int — must come back as bool, not int
    assert type(_cell(True)) is bool

def test_cell_float():
    v = _cell(3.14)
    assert isinstance(v, float) and abs(v - 3.14) < 1e-10

def test_cell_nan_becomes_string():
    assert _cell(float("nan")) == "nan"

def test_cell_inf_becomes_string():
    assert _cell(float("inf")) == "inf"
    assert _cell(float("-inf")) == "-inf"

def test_cell_string_passthrough():
    assert _cell("hello") == "hello"

def test_cell_other_type_becomes_str():
    assert _cell([1, 2, 3]) == "[1, 2, 3]"


# ── numpy scalars (skipped if numpy not installed) ────────────────────────────

def test_cell_numpy_int():
    np = pytest.importorskip("numpy")
    v = _cell(np.int64(7))
    assert v == 7 and type(v) is int

def test_cell_numpy_float():
    np = pytest.importorskip("numpy")
    v = _cell(np.float32(1.5))
    assert isinstance(v, float)

def test_cell_numpy_bool():
    np = pytest.importorskip("numpy")
    v = _cell(np.bool_(True))
    assert v is True and type(v) is bool

def test_cell_numpy_nan():
    np = pytest.importorskip("numpy")
    assert _cell(np.float64("nan")) == "nan"

def test_numpy_array_rows():
    np = pytest.importorskip("numpy")
    r = _table(
        [[np.int64(1), np.float32(0.5)], [np.int64(2), np.float32(1.5)]],
        headers=["n", "val"],
    )
    assert r.data["rows"][0][0] == 1 and type(r.data["rows"][0][0]) is int

def test_numpy_2d_array():
    np = pytest.importorskip("numpy")
    arr = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
    r = _table(arr, headers=["a", "b", "c"])
    assert r.data["headers"] == ["a", "b", "c"]
    assert len(r.data["rows"]) == 2
    assert r.data["rows"][0] == [1.0, 2.0, 3.0]

def test_numpy_1d_array_raises():
    np = pytest.importorskip("numpy")
    with pytest.raises(ValueError, match="2-D"):
        table(np.array([1, 2, 3]), headers=["x"])


# ── pandas DataFrame (skipped if pandas not installed) ────────────────────────

def test_dataframe_columns_become_headers():
    pd = pytest.importorskip("pandas")
    df = pd.DataFrame({"city": ["London", "Tokyo"], "pop": [9.0, 13.9]})
    r = _table(df)
    assert r.data["headers"] == ["city", "pop"]
    assert r.data["rows"][0][0] == "London"

def test_dataframe_headers_override():
    pd = pytest.importorskip("pandas")
    df = pd.DataFrame({"a": [1], "b": [2]})
    r = _table(df, headers=["b", "a"])
    assert r.data["headers"] == ["b", "a"]
    assert r.data["rows"][0] == [2, 1]

def test_dataframe_caption():
    pd = pytest.importorskip("pandas")
    df = pd.DataFrame({"x": [1, 2]})
    r = _table(df, caption="Numbers")
    assert r.data["caption"] == "Numbers"


# ── head / tail elision ──────────────────────────────────────────────────────
#
# Only DataFrames and arrays are elided by default; a hand-written list is
# deliberate and is left alone unless head=/tail= is passed explicitly.

def _dicts(n):
    return [{"n": i, "sq": i * i} for i in range(n)]


def _frame(n):
    pd = pytest.importorskip("pandas")
    return pd.DataFrame({"n": range(n), "sq": [i * i for i in range(n)]})


def test_plain_list_is_not_elided_by_default():
    r = _table(_dicts(50))
    assert len(r.data["rows"]) == 50
    assert ["...", "..."] not in r.data["rows"]


def test_list_of_lists_is_not_elided_by_default():
    r = _table([[i, i] for i in range(50)], headers=["a", "b"])
    assert len(r.data["rows"]) == 50


def test_dataframe_is_elided_by_default():
    r = _table(_frame(1000))
    rows = r.data["rows"]
    assert len(rows) == 11
    assert rows[:5] == [[i, i * i] for i in range(5)]
    assert rows[5] == ["...", "..."]
    assert rows[6:] == [[i, i * i] for i in range(995, 1000)]


def test_numpy_array_is_elided_by_default():
    np = pytest.importorskip("numpy")
    r = _table(np.arange(2000).reshape(1000, 2), headers=["a", "b"])
    assert len(r.data["rows"]) == 11
    assert r.data["rows"][5] == ["...", "..."]


def test_short_dataframe_is_untouched():
    r = _table(_frame(10))
    assert len(r.data["rows"]) == 10
    assert ["...", "..."] not in r.data["rows"]


def test_dataframe_one_over_the_limit_is_elided():
    r = _table(_frame(11))
    assert len(r.data["rows"]) == 11
    assert r.data["rows"][5] == ["...", "..."]


def test_dataframe_opts_out_with_none():
    r = _table(_frame(50), head=None, tail=None)
    assert len(r.data["rows"]) == 50


def test_explicit_head_and_tail_apply_to_a_plain_list():
    r = _table(_dicts(20), head=2, tail=3)
    rows = r.data["rows"]
    assert len(rows) == 6
    assert rows[:2] == [[0, 0], [1, 1]]
    assert rows[2] == ["...", "..."]
    assert rows[3:] == [[17, 289], [18, 324], [19, 361]]


def test_head_alone_shows_only_the_first_rows():
    r = _table(_dicts(20), head=3)
    assert r.data["rows"] == [[0, 0], [1, 1], [2, 4]]


def test_tail_alone_shows_only_the_last_rows():
    r = _table(_dicts(20), tail=3)
    assert r.data["rows"] == [[17, 289], [18, 324], [19, 361]]


def test_head_alone_has_no_ellipsis():
    r = _table(_dicts(20), head=3)
    assert ["...", "..."] not in r.data["rows"]


def test_tail_alone_has_no_ellipsis():
    r = _table(_dicts(20), tail=3)
    assert ["...", "..."] not in r.data["rows"]


def test_head_alone_on_a_dataframe():
    r = _table(_frame(1000), head=4)
    assert r.data["rows"] == [[i, i * i] for i in range(4)]


def test_tail_alone_on_a_dataframe():
    r = _table(_frame(1000), tail=4)
    assert r.data["rows"] == [[i, i * i] for i in range(996, 1000)]


def test_both_ends_keep_the_ellipsis():
    r = _table(_dicts(20), head=3, tail=2)
    rows = r.data["rows"]
    assert len(rows) == 6
    assert rows[3] == ["...", "..."]


def test_head_alone_shorter_than_the_data_is_untouched():
    r = _table(_dicts(3), head=10)
    assert len(r.data["rows"]) == 3


def test_tail_zero_puts_ellipsis_last():
    r = _table(_dicts(20), head=3, tail=0)
    rows = r.data["rows"]
    assert len(rows) == 4
    assert rows[-1] == ["...", "..."]


def test_head_zero_puts_ellipsis_first():
    r = _table(_dicts(20), head=0, tail=3)
    rows = r.data["rows"]
    assert len(rows) == 4
    assert rows[0] == ["...", "..."]


def test_ellipsis_row_matches_column_count():
    r = _table([{"a": 1, "b": 2, "c": 3}] * 20, head=2, tail=2)
    assert len(r.data["rows"][2]) == len(r.data["headers"]) == 3
    assert r.data["rows"][2] == ["...", "...", "..."]


def test_negative_head_raises():
    with pytest.raises(ValueError, match="negative"):
        _table(_dicts(3), head=-1)


def test_negative_tail_raises():
    with pytest.raises(ValueError, match="negative"):
        _table(_dicts(3), tail=-1)
