from lectrace.reference import Reference


def test_single_author():
    ref = Reference(authors=["John Smith"], date="2024-01-01")
    assert ref.label == "[Smith 2024]"


def test_multiple_authors():
    ref = Reference(authors=["John Smith", "Jane Doe"], date="2023-06-15")
    assert ref.label == "[Smith+ 2023]"


def test_team_author():
    ref = Reference(authors=["Kimi Team"], date="2025-03-01")
    assert "Kimi Team" in ref.label
    assert "+" not in ref.label


def test_title_fallback():
    ref = Reference(title="My Paper")
    assert ref.label == "My Paper"


def test_url_fallback():
    ref = Reference(url="https://example.com")
    assert ref.label == "https://example.com"


def test_empty_reference():
    assert Reference().label == "?"


def test_no_date():
    ref = Reference(authors=["Alice"], date=None)
    assert ref.label == "[Alice ?]"


def test_date_only_year_used():
    ref = Reference(authors=["Bob Jones"], date="2022-12-31")
    assert "2022" in ref.label
