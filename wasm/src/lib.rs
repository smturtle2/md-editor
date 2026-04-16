use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocBlock {
    pub kind: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutlineItem {
    pub depth: usize,
    pub text: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocStats {
    pub words: usize,
    pub characters: usize,
    pub reading_minutes: usize,
    pub headings: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocSnapshot {
    pub source: String,
    pub blocks: Vec<DocBlock>,
    pub outline: Vec<OutlineItem>,
    pub stats: DocStats,
}

fn normalize_markdown(markdown: &str) -> String {
    let normalized = markdown.replace("\r\n", "\n");
    let trimmed = normalized.trim_end_matches('\n');
    if trimmed.is_empty() {
        "\n".to_string()
    } else {
        format!("{trimmed}\n")
    }
}

fn build_outline_internal(markdown: &str) -> Vec<OutlineItem> {
    normalize_markdown(markdown)
        .lines()
        .filter_map(|line| {
            let hashes = line.chars().take_while(|character| *character == '#').count();
            if hashes == 0 || hashes > 6 {
                return None;
            }

            let text = line[hashes..].trim();
            if text.is_empty() {
                return None;
            }

            Some(OutlineItem {
                depth: hashes,
                text: text.to_string(),
                slug: slugify(text),
            })
        })
        .collect()
}

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|character| {
            if character.is_alphanumeric() {
                character
            } else if character.is_whitespace() || character == '-' {
                '-'
            } else {
                '\0'
            }
        })
        .filter(|character| *character != '\0')
        .collect::<String>()
        .split('-')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn document_stats_internal(markdown: &str) -> DocStats {
    let outline = build_outline_internal(markdown);
    let plain = normalize_markdown(markdown)
        .replace("```", " ")
        .replace("$$", " ")
        .chars()
        .map(|character| {
            if matches!(character, '#' | '>' | '*' | '_' | '[' | ']' | '(' | ')' | '`' | '|' | '-') {
                ' '
            } else {
                character
            }
        })
        .collect::<String>();

    let plain = plain.split_whitespace().collect::<Vec<_>>().join(" ");
    let words = if plain.is_empty() {
        0
    } else {
        plain.split(' ').count()
    };

    DocStats {
        words,
        characters: plain.chars().count(),
        reading_minutes: usize::max(1, (words + 219) / 220),
        headings: outline.len(),
    }
}

fn build_blocks_internal(markdown: &str) -> Vec<DocBlock> {
    normalize_markdown(markdown)
        .split("\n\n")
        .map(str::trim)
        .filter(|chunk| !chunk.is_empty())
        .map(|chunk| {
            let first_line = chunk.lines().next().unwrap_or_default();
            let kind = if first_line.starts_with('#') {
                "heading"
            } else if first_line.starts_with("```mermaid") {
                "mermaid"
            } else if first_line.starts_with("$$") {
                "math"
            } else if first_line.starts_with("> [!") {
                "callout"
            } else if first_line.starts_with('|') {
                "table"
            } else {
                "paragraph"
            };

            DocBlock {
                kind: kind.to_string(),
                text: chunk.to_string(),
            }
        })
        .collect()
}

fn parse_snapshot(markdown: &str) -> DocSnapshot {
    let source = normalize_markdown(markdown);
    DocSnapshot {
        source: source.clone(),
        blocks: build_blocks_internal(&source),
        outline: build_outline_internal(&source),
        stats: document_stats_internal(&source),
    }
}

#[wasm_bindgen]
pub fn parse_markdown(markdown: &str) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&parse_snapshot(markdown))
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn normalize_import(markdown: &str) -> Result<JsValue, JsValue> {
    parse_markdown(markdown)
}

#[wasm_bindgen]
pub fn serialize_markdown(snapshot: JsValue) -> Result<String, JsValue> {
    let snapshot: DocSnapshot =
        serde_wasm_bindgen::from_value(snapshot).map_err(|error| JsValue::from_str(&error.to_string()))?;

    if !snapshot.source.trim().is_empty() {
        return Ok(normalize_markdown(&snapshot.source));
    }

    let reconstructed = snapshot
        .blocks
        .iter()
        .map(|block| block.text.trim())
        .filter(|text| !text.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");

    Ok(normalize_markdown(&reconstructed))
}

#[wasm_bindgen]
pub fn build_outline(markdown: &str) -> Result<String, JsValue> {
    serde_json::to_string(&build_outline_internal(markdown))
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn document_stats(markdown: &str) -> Result<String, JsValue> {
    serde_json::to_string(&document_stats_internal(markdown))
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_outline() {
        let outline = build_outline_internal("# Title\n\n## Details\n");
        assert_eq!(outline.len(), 2);
        assert_eq!(outline[0].slug, "title");
    }

    #[test]
    fn keeps_unicode_outline_slugs() {
        let outline = build_outline_internal("# 시작하기\n\n## 문서 개요\n");
        assert_eq!(outline[0].slug, "시작하기");
        assert_eq!(outline[1].slug, "문서-개요");
    }

    #[test]
    fn normalizes_newlines() {
        let normalized = normalize_markdown("Hello\r\nWorld");
        assert_eq!(normalized, "Hello\nWorld\n");
    }

    #[test]
    fn calculates_stats() {
        let stats = document_stats_internal("# Title\n\nA short paragraph.");
        assert_eq!(stats.headings, 1);
        assert!(stats.words >= 3);
    }
}
