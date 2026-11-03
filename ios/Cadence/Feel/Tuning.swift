import SwiftUI
import UIKit

/// Every animation and haptic value in the app lives here.
/// Tune feel on device by editing this file only.
enum Tuning {

    // MARK: Motion

    enum Motion {
        /// Press-down scale of a habit capsule.
        static let pressedScale: CGFloat = 0.965
        /// Scale while a capsule is lifted for reordering.
        static let liftedScale: CGFloat = 1.02

        /// Press / release spring. Crisp, not bouncy.
        static let press = Animation.spring(response: 0.30, dampingFraction: 0.80)
        /// Fill sweep across the capsule on complete / un-complete.
        static let fill = Animation.spring(response: 0.42, dampingFraction: 0.86)
        /// Rows sliding out of the way during a reorder.
        static let reorder = Animation.spring(response: 0.30, dampingFraction: 0.85)
        /// Progress rings.
        static let ring = Animation.spring(response: 0.55, dampingFraction: 0.90)
        /// Numbers counting up / down.
        static let count = Animation.easeOut(duration: 0.65)
        /// Detail grid dots.
        static let dot = Animation.spring(response: 0.25, dampingFraction: 0.80)
    }

    // MARK: Gestures

    enum Gesture {
        /// Hold time before long-press (history / reorder) engages.
        static let longPress: Double = 0.35
        /// Movement under this after a long-press counts as "release to open history".
        static let openSlop: CGFloat = 8
    }

    // MARK: Haptics

    enum Haptic {
        static let completeStyle: UIImpactFeedbackGenerator.FeedbackStyle = .rigid
        static let completeIntensity: CGFloat = 1.0

        static let uncompleteStyle: UIImpactFeedbackGenerator.FeedbackStyle = .light
        static let uncompleteIntensity: CGFloat = 0.7

        static let reorderStyle: UIImpactFeedbackGenerator.FeedbackStyle = .light
        static let reorderIntensity: CGFloat = 0.55

        /// Gap between the .rigid tap and the day-complete .success, so they read as two beats.
        static let successDelay: Double = 0.14
    }

    // MARK: Layout

    enum Layout {
        static let capsuleHeight: CGFloat = 76
        static let rowSpacing: CGFloat = 10
        static var rowPitch: CGFloat { capsuleHeight + rowSpacing }
        static let gutter: CGFloat = 16
    }
}
