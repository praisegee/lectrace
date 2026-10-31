import subprocess
import sys


def test_python_m_lectrace_runs_the_cli():
    result = subprocess.run(
        [sys.executable, "-m", "lectrace", "--help"], capture_output=True, text=True, check=False
    )
    assert result.returncode == 0
    assert "serve" in result.stdout
