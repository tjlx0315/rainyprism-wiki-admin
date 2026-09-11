from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "site/index.html").read_text()
CSS = (ROOT / "site/styles.css").read_text()
SCRIPT = (ROOT / "site/script.js").read_text()
EXHIBITION_SCRIPT = (ROOT / "site/exhibition/exhibition-test.js").read_text()


def test_home_exhibition_has_six_cd_case_cards():
    cards = re.findall(r'class="art-card\b[^>]*"', HTML)
    assert len(cards) == 6
    assert "grid-template-columns: repeat(3" in CSS
    assert "art-card__spine" in HTML
    assert "art-card__cover" in HTML
    assert "aspect-ratio: 1.08 / 1" in CSS
    assert ".slice(0, 6)" in SCRIPT


def test_each_cd_row_sits_on_its_shelf_without_overflow():
    gallery_rule = re.search(r"\.gallery-row \{([^}]+)\}", CSS).group(1)
    assert "height: auto" in gallery_rule
    assert "grid-template-rows" not in gallery_rule
    assert "row-gap: 30px" in gallery_rule
    assert "top: calc(50% - 15px)" in CSS


def test_home_cd_links_open_the_single_assigned_role():
    assert "work.roles?.[0]" in SCRIPT
    assert 'view=roles&role=' in SCRIPT


def test_admin_can_choose_and_order_six_home_images():
    assert "work.roles.length === 1" in EXHIBITION_SCRIPT
    assert ".slice(0, 6)" in EXHIBITION_SCRIPT
    assert "selected.length < 6" in EXHIBITION_SCRIPT
    assert "按 01 至 06" in EXHIBITION_SCRIPT


def test_exhibition_accepts_a_role_deep_link():
    assert "new URLSearchParams(window.location.search)" in EXHIBITION_SCRIPT
    assert 'requestedView === "roles"' in EXHIBITION_SCRIPT


if __name__ == "__main__":
    test_home_exhibition_has_six_cd_case_cards()
    test_each_cd_row_sits_on_its_shelf_without_overflow()
    test_home_cd_links_open_the_single_assigned_role()
    test_admin_can_choose_and_order_six_home_images()
    test_exhibition_accepts_a_role_deep_link()
    print("home exhibition layout test: PASS")
