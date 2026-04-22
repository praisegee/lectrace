import textwrap
import tempfile
from pathlib import Path
from lectrace.tracer import execute


def _write(content: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w")
    tmp.write(textwrap.dedent(content))
    tmp.close()
    return Path(tmp.name)


def test_basic_execution():
    path = _write("""
        def main():
            x = 1
            y = 2
    """)
    trace = execute(path)
    assert len(trace.steps) > 0
    assert trace.metadata.error is None


def test_inspect_directive():
    path = _write("""
        def main():
            x = 42  # @inspect x
    """)
    trace = execute(path)
    env_steps = [s for s in trace.steps if s.env]
    assert env_steps
    val = env_steps[-1].env.get("x")
    assert val is not None
    assert val["contents"] == 42


def test_hide_directive():
    path = _write("""
        def main():
            secret = 1  # @hide
            visible = 2
    """)
    trace = execute(path)
    rel_path = list(trace.hidden_line_numbers.keys())[0]
    assert len(trace.hidden_line_numbers[rel_path]) >= 1


def test_partial_trace_on_error():
    path = _write("""
        def main():
            x = 1  # @inspect x
            raise RuntimeError("oops")
    """)
    trace = execute(path)
    assert trace.metadata.error is not None
    assert trace.metadata.error.exception_type == "RuntimeError"
    assert len(trace.steps) > 0


def test_version_in_metadata():
    path = _write("""
        def main():
            pass
    """)
    trace = execute(path)
    assert trace.version == "2"
    assert trace.metadata.python_version
    assert trace.metadata.lectrace_version


def test_inspect_all():
    path = _write("""
        def main():
            a = 10
            b = "hello"
    """)
    trace = execute(path, inspect_all=True)
    all_envs = {k: v for s in trace.steps for k, v in s.env.items()}
    assert "a" in all_envs or "b" in all_envs
