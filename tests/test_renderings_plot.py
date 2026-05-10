import pytest
from lectrace.renderings import flush, plot, _set_active


def _plot_in_lectrace(spec):
    _set_active(True)
    try:
        plot(spec)
        return flush()
    finally:
        _set_active(False)


def _plot_standalone(spec):
    plot(spec)
    return flush()


# ── Vega-Lite dict (no matplotlib needed) ────────────────────────────────────

def test_vega_dict_stored_regardless_of_context():
    spec = {"mark": "point", "data": {"values": []}}
    r = _plot_in_lectrace(spec)
    assert len(r) == 1
    assert r[0].type == "plot"
    assert r[0].data is spec


def test_vega_dict_stored_in_standalone():
    spec = {"mark": "bar"}
    r = _plot_standalone(spec)
    assert len(r) == 1
    assert r[0].type == "plot"


# ── matplotlib Figure ─────────────────────────────────────────────────────────

@pytest.fixture
def mpl():
    return pytest.importorskip("matplotlib.pyplot")


def test_figure_captured_in_lectrace(mpl):
    fig, ax = mpl.subplots()
    ax.plot([1, 2], [3, 4])
    renderings = _plot_in_lectrace(fig)
    assert len(renderings) == 1
    r = renderings[0]
    assert r.type == "image"
    assert r.data.startswith("data:image/svg+xml;base64,")


def test_figure_closed_after_capture_in_lectrace(mpl):
    fig, ax = mpl.subplots()
    ax.plot([1, 2], [3, 4])
    fig_num = fig.number
    _plot_in_lectrace(fig)
    assert fig_num not in mpl.get_fignums()


def test_figure_noop_in_standalone(mpl):
    fig, ax = mpl.subplots()
    ax.plot([1, 2], [3, 4])
    renderings = _plot_standalone(fig)
    assert renderings == []
    mpl.close(fig)


# ── matplotlib Axes ───────────────────────────────────────────────────────────

def test_axes_captured_in_lectrace(mpl):
    fig, ax = mpl.subplots()
    ax.bar(["A", "B"], [1, 2])
    renderings = _plot_in_lectrace(ax)
    assert len(renderings) == 1
    assert renderings[0].type == "image"
    assert renderings[0].data.startswith("data:image/svg+xml;base64,")


def test_axes_noop_in_standalone(mpl):
    fig, ax = mpl.subplots()
    ax.bar(["A", "B"], [1, 2])
    renderings = _plot_standalone(ax)
    assert renderings == []
    mpl.close(fig)


# ── no double-capture when both lectrace.plot() and plt.show() are called ─────

def test_no_double_capture_when_plot_then_show(mpl):
    fig, ax = mpl.subplots()
    ax.plot([1], [1])

    _set_active(True)
    try:
        plot(fig)                  # captures and closes fig
        mpl.show()                 # fig is already closed — nothing left to show
        renderings = flush()
    finally:
        _set_active(False)

    assert len(renderings) == 1   # captured exactly once
