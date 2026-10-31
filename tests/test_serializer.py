import datetime
import json
import math
import pathlib
from dataclasses import dataclass

import pytest

from lectrace.serializer import serialize


def test_none():
    assert serialize(None) == {"type": "NoneType", "contents": None}


def test_bool():
    assert serialize(True) == {"type": "bool", "contents": True}


def test_int():
    assert serialize(42) == {"type": "int", "contents": 42}


def test_float():
    r = serialize(3.14)
    assert r["type"] == "float"
    assert abs(r["contents"] - 3.14) < 1e-10


def test_nan():
    r = serialize(float("nan"))
    assert r["contents"] == "nan"


def test_inf():
    r = serialize(float("inf"))
    assert r["contents"] == "inf"


def test_str():
    assert serialize("hello") == {"type": "str", "contents": "hello"}


def test_complex():
    r = serialize(1 + 2j)
    assert r["type"] == "complex"
    assert r["contents"] == {"real": 1.0, "imag": 2.0}


def test_list():
    r = serialize([1, 2, 3])
    assert r["type"] == "list"
    assert len(r["contents"]) == 3
    assert r["contents"][0] == {"type": "int", "contents": 1}


def test_tuple():
    r = serialize((1, "a"))
    assert r["type"] == "tuple"


def test_set():
    r = serialize({1, 2, 3})
    assert r["type"] == "set"
    assert len(r["contents"]) == 3


def test_dict():
    r = serialize({"a": 1, "b": 2})
    assert r["type"] == "dict"
    assert r["contents"]["a"] == {"type": "int", "contents": 1}


def test_nested():
    r = serialize({"x": [1, 2], "y": {"z": True}})
    assert r["contents"]["y"]["contents"]["z"] == {"type": "bool", "contents": True}


def test_datetime():
    dt = datetime.datetime(2025, 1, 15, 12, 0, 0)
    r = serialize(dt)
    assert r["type"].endswith("datetime")
    assert "2025-01-15" in r["contents"]


def test_path():
    r = serialize(pathlib.Path("/tmp/foo"))
    assert r["contents"] == "/tmp/foo"


def test_dataclass():
    @dataclass
    class Point:
        x: int
        y: int

    r = serialize(Point(1, 2))
    assert r["contents"]["x"] == {"type": "int", "contents": 1}


def test_custom_protocol():
    class Fancy:
        def __lectrace__(self):
            return {"a": 1}

    r = serialize(Fancy())
    assert r["type"] == "dict"


def test_depth_limit():
    deeply_nested = [[[[[[[[[[[[[42]]]]]]]]]]]]]
    r = serialize(deeply_nested)
    # Should not crash, just hit depth limit somewhere
    assert r is not None


def test_fallback_to_repr():
    class Weird:
        def __repr__(self):
            return "weird_object"

    r = serialize(Weird())
    assert r["contents"] == "weird_object"


def test_numpy_lazy_import():
    try:
        import numpy as np
        r = serialize(np.array([1, 2, 3]))
        assert r["shape"] == [3]
        assert r["dtype"] == "int64" or r["dtype"].startswith("int")
    except ImportError:
        pass  # fine — numpy is optional


def test_numpy_2d():
    try:
        import numpy as np
        r = serialize(np.zeros((2, 3)))
        assert r["shape"] == [2, 3]
    except ImportError:
        pass


def test_frozenset():
    r = serialize(frozenset({1, 2}))
    assert r["type"] == "frozenset"
    assert len(r["contents"]) == 2


def test_non_string_dict_keys():
    r = serialize({1: "a", (2, 3): "b"})
    assert r["type"] == "dict"
    assert "1" in r["contents"]
    assert repr((2, 3)) in r["contents"]


def test_empty_list():
    r = serialize([])
    assert r == {"type": "list", "contents": []}


def test_empty_dict():
    r = serialize({})
    assert r == {"type": "dict", "contents": {}}


def test_tensor_small_keeps_contents_and_summary():
    np = pytest.importorskip("numpy")
    r = serialize(np.arange(6, dtype=np.float32).reshape(2, 3))
    assert r["contents"] == [[0, 1, 2], [3, 4, 5]]
    assert "truncated" not in r
    s = r["summary"]
    assert s["min"] == 0 and s["max"] == 5 and s["mean"] == 2.5
    assert s["nan"] == 0 and s["inf"] == 0


def test_tensor_large_is_previewed():
    np = pytest.importorskip("numpy")
    r = serialize(np.ones((4, 100, 70)))
    assert r["shape"] == [4, 100, 70]
    assert r["truncated"] is True
    assert len(r["contents"]) == 32 and len(r["contents"][0]) == 32
    assert r["contents"][0][0] == 1.0
    assert r["summary"]["std"] == 0.0


def test_tensor_large_1d_preview_is_one_row():
    np = pytest.importorskip("numpy")
    r = serialize(np.arange(1000))
    assert len(r["contents"]) == 1 and len(r["contents"][0]) == 32
    # Block averages stay in order across the vector.
    assert r["contents"][0][0] < r["contents"][0][-1]


def test_tensor_preview_keeps_small_axis():
    np = pytest.importorskip("numpy")
    r = serialize(np.zeros((3, 500)))
    assert len(r["contents"]) == 3 and len(r["contents"][0]) == 32


def test_tensor_nan_is_valid_json():
    np = pytest.importorskip("numpy")
    r = serialize(np.array([1.0, float("nan"), float("inf"), -float("inf")]))
    assert r["contents"] == [1.0, "nan", "inf", "-inf"]
    assert r["summary"]["nan"] == 1 and r["summary"]["inf"] == 2
    assert r["summary"]["mean"] == 1.0
    json.dumps(r, allow_nan=False)


def test_tensor_all_nan_has_counts_only():
    np = pytest.importorskip("numpy")
    r = serialize(np.full(300, float("nan")))
    assert r["summary"] == {"nan": 300, "inf": 0}
    json.dumps(r, allow_nan=False)


def test_tensor_bool_summary_is_fraction():
    np = pytest.importorskip("numpy")
    r = serialize(np.array([True, False, True, True]))
    assert r["summary"]["mean"] == 0.75


def test_tensor_scalar_has_no_summary():
    np = pytest.importorskip("numpy")
    r = serialize(np.array(3.0))
    assert r["contents"] == 3.0
    assert "summary" not in r


def test_torch_tensor_summary():
    torch = pytest.importorskip("torch")
    pytest.importorskip("numpy")
    r = serialize(torch.zeros(64, 64, dtype=torch.bfloat16, requires_grad=True))
    assert r["dtype"] == "torch.bfloat16"
    assert r["truncated"] is True
    assert r["summary"]["max"] == 0.0
