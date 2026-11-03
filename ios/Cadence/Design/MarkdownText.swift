import SwiftUI

/// Lightweight block-level Markdown renderer for Claude's replies (headings, bullets, numbered lists, paragraphs),
/// with inline styling (bold, italic, code, links) handled by `AttributedString`.
struct MarkdownText: View {
    let text: String
    var font: Font = .system(size: 16)

    private enum Block: Hashable {
        case heading(String)
        case bullet(String)
        case numbered(String, String)
        case paragraph(String)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                switch block {
                case .heading(let t):
                    inline(t)
                        .font(.rounded(17, .bold))
                        .foregroundStyle(Theme.textPrimary)
                        .padding(.top, 4)
                case .bullet(let t):
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Circle().fill(Theme.aqua).frame(width: 5, height: 5).offset(y: -2)
                        inline(t)
                    }
                case .numbered(let n, let t):
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(n).font(font.weight(.semibold)).foregroundStyle(Theme.aqua).monospacedDigit()
                        inline(t)
                    }
                case .paragraph(let t):
                    inline(t)
                }
            }
        }
        .font(font)
        .foregroundStyle(Theme.textPrimary.opacity(0.92))
        .lineSpacing(3)
        .textSelection(.enabled)
    }

    private func inline(_ string: String) -> Text {
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        if let attributed = try? AttributedString(markdown: string, options: options) {
            return Text(attributed)
        }
        return Text(string)
    }

    private var blocks: [Block] {
        var result: [Block] = []
        var paragraph: [String] = []

        func flush() {
            if !paragraph.isEmpty {
                result.append(.paragraph(paragraph.joined(separator: " ")))
                paragraph = []
            }
        }

        for rawLine in text.components(separatedBy: "\n") {
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            if line.isEmpty { flush(); continue }
            if line.hasPrefix("#") {
                flush()
                result.append(.heading(line.drop(while: { $0 == "#" }).trimmingCharacters(in: .whitespaces)))
            } else if line.hasPrefix("- ") || line.hasPrefix("* ") || line.hasPrefix("• ") {
                flush()
                result.append(.bullet(String(line.dropFirst(2))))
            } else if let dot = line.firstIndex(of: "."), line[..<dot].allSatisfy(\.isNumber), !line[..<dot].isEmpty,
                      line.index(after: dot) < line.endIndex, line[line.index(after: dot)] == " " {
                flush()
                result.append(.numbered(String(line[...dot]), String(line[line.index(dot, offsetBy: 2)...])))
            } else if line == "---" {
                flush()
            } else {
                paragraph.append(line)
            }
        }
        flush()
        return result
    }
}
