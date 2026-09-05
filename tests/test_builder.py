import json

import pytest

from lectrace.builder import build

LECTURE = 'from lectrace import text\n\n\ndef main():\n    text("{title}")\n\n\nmain()\n'


@pytest.fixture
def site(tmp_path, monkeypatch):
    for name in ("01_one.py", "02_two.py"):
        (tmp_path / name).write_text(LECTURE.format(title=name))
    monkeypatch.chdir(tmp_path)
    return tmp_path


def _ids(out):
    return [e["id"] for e in json.loads((out / "traces/index.json").read_text())["traces"]]


def test_partial_build_keeps_other_lectures(site):
    out = site / "_site"
    build(output=out)
    assert _ids(out) == ["01_one", "02_two"]

    # Rebuild only one — as `lectrace build 01_one.py` and the serve watcher do.
    build(output=out, files=[site / "01_one.py"], incremental=False)

    assert (out / "traces/02_two.json").exists()
    assert _ids(out) == ["01_one", "02_two"]


def test_partial_build_of_a_new_lecture_adds_to_index(site):
    out = site / "_site"
    build(output=out)
    (site / "03_three.py").write_text(LECTURE.format(title="03_three.py"))

    build(output=out, files=[site / "03_three.py"])

    assert _ids(out) == ["01_one", "02_two", "03_three"]


def test_incremental_rebuilds_a_missing_trace(site):
    out = site / "_site"
    build(output=out)
    (out / "traces/02_two.json").unlink()

    # Source is unchanged, so the cache would otherwise re-index a missing file.
    build(output=out, incremental=True)

    assert (out / "traces/02_two.json").exists()
    assert _ids(out) == ["01_one", "02_two"]


def test_full_build_still_prunes_deleted_lectures(site):
    out = site / "_site"
    build(output=out)
    (site / "02_two.py").unlink()

    build(output=out)

    assert not (out / "traces/02_two.json").exists()
    assert _ids(out) == ["01_one"]
