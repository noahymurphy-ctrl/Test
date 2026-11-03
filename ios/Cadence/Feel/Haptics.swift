import UIKit

/// Thin wrapper so call sites read as intent, and tuning stays in `Tuning.Haptic`.
@MainActor
enum Haptics {
    private static let complete = UIImpactFeedbackGenerator(style: Tuning.Haptic.completeStyle)
    private static let uncomplete = UIImpactFeedbackGenerator(style: Tuning.Haptic.uncompleteStyle)
    private static let reorder = UIImpactFeedbackGenerator(style: Tuning.Haptic.reorderStyle)
    private static let notify = UINotificationFeedbackGenerator()

    /// Warm up the Taptic Engine on touch-down. Produces no feedback by itself.
    static func warmUp() {
        complete.prepare()
        uncomplete.prepare()
    }

    static func completed(finishedDay: Bool) {
        complete.prepare()
        complete.impactOccurred(intensity: Tuning.Haptic.completeIntensity)
        guard finishedDay else { return }
        notify.prepare()
        DispatchQueue.main.asyncAfter(deadline: .now() + Tuning.Haptic.successDelay) {
            notify.prepare()
            notify.notificationOccurred(.success)
        }
    }

    static func uncompleted() {
        uncomplete.prepare()
        uncomplete.impactOccurred(intensity: Tuning.Haptic.uncompleteIntensity)
    }

    static func reorderStep() {
        reorder.prepare()
        reorder.impactOccurred(intensity: Tuning.Haptic.reorderIntensity)
    }
}
