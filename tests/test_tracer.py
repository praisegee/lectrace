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


def test_stepover_does_not_enter_function():
    path = _write("""
        def main():
            result = helper()  # @stepover

        def helper():
            x = 99
            return x
    """)
    trace = execute(path)
    function_names = {frame.function_name for s in trace.steps for frame in s.stack}
    assert "helper" not in function_names


def test_helper_function_locals_shown_automatically():
    path = _write("""
        def main():
            add(1, 2)

        def add(a, b):
            result = a + b
            return result
    """)
    trace = execute(path)
    all_envs = {k: v for s in trace.steps for k, v in s.env.items()}
    assert "result" in all_envs


def test_call_stack_depth_inside_helper():
    path = _write("""
        def main():
            helper()

        def helper():
            x = 1
    """)
    trace = execute(path)
    deep_steps = [s for s in trace.steps if len(s.stack) >= 2]
    assert deep_steps
    fn_names = {frame.function_name for s in deep_steps for frame in s.stack}
    assert "main" in fn_names
    assert "helper" in fn_names


def test_bare_inspect_shows_all_locals():
    path = _write("""
        def main():
            a = 1
            b = 2  # @inspect
    """)
    trace = execute(path)
    all_envs = {k: v for s in trace.steps for k, v in s.env.items()}
    assert "a" in all_envs
    assert "b" in all_envs
