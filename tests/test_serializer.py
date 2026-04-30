import math
import datetime
import pathlib
from dataclasses import dataclass
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
