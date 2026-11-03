import XCTest

/// Drives the real gestures in the simulator: tap, hold, hold + drag.
final class InteractionTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-seed"]
        app.launch()
    }

    private func habit(_ name: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: "habit.\(name)").firstMatch
    }

    private func waitFor(_ el: XCUIElement, valuePrefix: String) {
        let p = NSPredicate(format: "value BEGINSWITH %@", valuePrefix)
        wait(for: [expectation(for: p, evaluatedWith: el)], timeout: 3)
    }

    func testTapTogglesCompletion() {
        let meditate = habit("Meditate")
        XCTAssertTrue(meditate.waitForExistence(timeout: 5))
        waitFor(meditate, valuePrefix: "Not done")
        meditate.tap()
        waitFor(meditate, valuePrefix: "Done")
        meditate.tap()
        waitFor(meditate, valuePrefix: "Not done")
    }

    func testHoldOpensHistory() {
        let read = habit("Read 20 pages")
        XCTAssertTrue(read.waitForExistence(timeout: 5))
        read.press(forDuration: 0.8)
        XCTAssertTrue(app.buttons["Edit"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Read 20 pages"].exists)
    }

    func testHoldAndDragReorders() {
        let water = habit("Drink water"), phone = habit("No phone in bed"), meditate = habit("Meditate")
        XCTAssertTrue(water.waitForExistence(timeout: 5))
        XCTAssertLessThan(water.frame.minY, meditate.frame.minY)
        water.press(forDuration: 0.6, thenDragTo: phone)
        let moved = NSPredicate { _, _ in water.frame.minY > meditate.frame.minY }
        wait(for: [expectation(for: moved, evaluatedWith: nil)], timeout: 3)
        // Not opened as history.
        XCTAssertFalse(app.buttons["Edit"].exists)
    }
}
