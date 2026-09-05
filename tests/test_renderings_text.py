from lectrace.renderings import _set_active, flush, text

SOURCE = 'def main():\n    x = 1\n\nif __name__ == "__main__":\n    main()'


def _render(*args, **kwargs) -> dict:
    _set_active(True)
    try:
        flush()
        text(*args, **kwargs)
        return vars(flush()[0])
    finally:
        _set_active(False)


def test_plain_text_is_not_fenced():
    r = _render("hello **world**")
    assert r["data"] == "hello **world**"
    assert r["style"] is None


def test_verbatim_emits_a_fenced_block():
    r = _render(SOURCE, verbatim=True)
    assert r["data"].startswith("```\n")
    assert r["data"].endswith("\n```")


def test_verbatim_preserves_indentation_and_dunders():
    r = _render(SOURCE, verbatim=True)
    assert "\n    x = 1" in r["data"]
    assert '__name__ == "__main__"' in r["data"]


def test_language_sets_the_fence_info_string():
    r = _render(SOURCE, language="python")
    assert r["data"].startswith("```python\n")


def test_language_implies_verbatim():
    r = _render("x = 1", language="python")
    assert r["data"] == "```python\nx = 1\n```"


def test_verbatim_no_longer_leaks_css_styling():
    r = _render(SOURCE, verbatim=True)
    assert r["style"] is None


def test_explicit_style_still_passes_through():
    r = _render(SOURCE, style={"color": "red"}, verbatim=True)
    assert r["style"] == {"color": "red"}


def test_fence_grows_past_backticks_in_content():
    r = _render("here is ``` a fence", verbatim=True)
    assert r["data"].startswith("````\n")
    assert r["data"].endswith("\n````")


def test_dedent_still_applies():
    r = _render("\n    a = 1\n    b = 2\n", verbatim=True)
    assert r["data"] == "```\na = 1\nb = 2\n```"
