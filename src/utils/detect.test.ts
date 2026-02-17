import { describe, expect, it } from "vitest";
import { classifyFile, classifyInput, classifyURL } from "./detect.js";

describe("classifyInput", () => {
  it("returns 'url' for http URLs", () => {
    expect(classifyInput("https://example.com")).toEqual({ type: "url" });
  });

  it("returns 'url' for http URL", () => {
    expect(classifyInput("http://example.com")).toEqual({ type: "url" });
  });

  it("returns 'url' for YouTube URL", () => {
    expect(
      classifyInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toEqual({ type: "url" });
  });

  it("returns 'file' for existing file path", () => {
    expect(classifyInput("package.json")).toEqual({ type: "file" });
  });

  it("returns 'unknown' for empty string", () => {
    expect(classifyInput("")).toEqual({ type: "unknown" });
  });

  it("returns 'unknown' for whitespace-only string", () => {
    expect(classifyInput("   ")).toEqual({ type: "unknown" });
  });

  it("returns 'unknown' for gibberish", () => {
    expect(classifyInput("asdfghjkl123")).toEqual({ type: "unknown" });
  });

  it("returns 'unknown' for non-existent file path", () => {
    expect(classifyInput("nonexistent-file.txt")).toEqual({ type: "unknown" });
  });
});

describe("classifyURL", () => {
  it("detects standard YouTube watch URL", () => {
    expect(classifyURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "youtube"
    );
  });

  it("detects short YouTube URL", () => {
    expect(classifyURL("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("detects YouTube embed URL", () => {
    expect(classifyURL("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "youtube"
    );
  });

  it("detects YouTube shorts URL", () => {
    expect(classifyURL("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "youtube"
    );
  });

  it("detects YouTube URL with extra params", () => {
    expect(
      classifyURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")
    ).toBe("youtube");
  });

  it("detects Google Docs URL", () => {
    expect(
      classifyURL(
        "https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit"
      )
    ).toBe("gdoc");
  });

  it("detects Google Docs URL without /edit", () => {
    expect(
      classifyURL(
        "https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
      )
    ).toBe("gdoc");
  });

  it("detects Twitter URL", () => {
    expect(classifyURL("https://twitter.com/user/status/123456")).toBe("tweet");
  });

  it("detects X.com URL", () => {
    expect(classifyURL("https://x.com/user/status/123456")).toBe("tweet");
  });

  it("detects www.twitter.com URL", () => {
    expect(classifyURL("https://www.twitter.com/user/status/123456")).toBe(
      "tweet"
    );
  });

  it("detects RSS feed URL with /feed path", () => {
    expect(classifyURL("https://example.com/feed")).toBe("rss");
  });

  it("detects RSS feed URL with /rss path", () => {
    expect(classifyURL("https://example.com/rss")).toBe("rss");
  });

  it("detects RSS feed URL with .xml extension", () => {
    expect(classifyURL("https://example.com/feed.xml")).toBe("rss");
  });

  it("detects RSS feed URL with .atom extension", () => {
    expect(classifyURL("https://example.com/feed.atom")).toBe("rss");
  });

  it("returns 'web' for generic URL", () => {
    expect(classifyURL("https://example.com")).toBe("web");
  });

  it("returns 'web' for blog URL", () => {
    expect(classifyURL("https://blog.example.com/post/hello-world")).toBe(
      "web"
    );
  });
});

describe("classifyFile", () => {
  it("detects PDF files", () => {
    expect(classifyFile("document.pdf")).toBe("pdf");
  });

  it("detects JPG images", () => {
    expect(classifyFile("photo.jpg")).toBe("image");
  });

  it("detects JPEG images", () => {
    expect(classifyFile("photo.jpeg")).toBe("image");
  });

  it("detects PNG images", () => {
    expect(classifyFile("screenshot.png")).toBe("image");
  });

  it("detects GIF images", () => {
    expect(classifyFile("animation.gif")).toBe("image");
  });

  it("detects WebP images", () => {
    expect(classifyFile("photo.webp")).toBe("image");
  });

  it("detects MP4 videos", () => {
    expect(classifyFile("video.mp4")).toBe("video");
  });

  it("detects MKV videos", () => {
    expect(classifyFile("video.mkv")).toBe("video");
  });

  it("detects AVI videos", () => {
    expect(classifyFile("video.avi")).toBe("video");
  });

  it("detects MOV videos", () => {
    expect(classifyFile("video.mov")).toBe("video");
  });

  it("detects WebM videos", () => {
    expect(classifyFile("video.webm")).toBe("video");
  });

  it("detects FLV videos", () => {
    expect(classifyFile("video.flv")).toBe("video");
  });

  it("detects WMV videos", () => {
    expect(classifyFile("video.wmv")).toBe("video");
  });

  it("detects M4V videos", () => {
    expect(classifyFile("video.m4v")).toBe("video");
  });

  it("detects MP3 audio", () => {
    expect(classifyFile("song.mp3")).toBe("audio");
  });

  it("detects WAV audio", () => {
    expect(classifyFile("recording.wav")).toBe("audio");
  });

  it("detects M4A audio", () => {
    expect(classifyFile("podcast.m4a")).toBe("audio");
  });

  it("detects OGG audio", () => {
    expect(classifyFile("track.ogg")).toBe("audio");
  });

  it("detects FLAC audio", () => {
    expect(classifyFile("lossless.flac")).toBe("audio");
  });

  it("detects AAC audio", () => {
    expect(classifyFile("audio.aac")).toBe("audio");
  });

  it("detects WMA audio", () => {
    expect(classifyFile("audio.wma")).toBe("audio");
  });

  it("detects DOCX files", () => {
    expect(classifyFile("document.docx")).toBe("docx");
  });

  it("detects DOC files", () => {
    expect(classifyFile("document.doc")).toBe("docx");
  });

  it("detects EPUB files", () => {
    expect(classifyFile("book.epub")).toBe("epub");
  });

  it("detects CSV files", () => {
    expect(classifyFile("data.csv")).toBe("csv");
  });

  it("detects TSV files", () => {
    expect(classifyFile("data.tsv")).toBe("csv");
  });

  it("detects PPTX files", () => {
    expect(classifyFile("slides.pptx")).toBe("pptx");
  });

  it("returns 'unknown' for unsupported extension", () => {
    expect(classifyFile("file.xyz")).toBe("unknown");
  });

  it("returns 'unknown' for file without extension", () => {
    expect(classifyFile("Makefile")).toBe("unknown");
  });

  it("handles uppercase extensions", () => {
    expect(classifyFile("PHOTO.JPG")).toBe("image");
  });

  it("handles mixed-case extensions", () => {
    expect(classifyFile("video.Mp4")).toBe("video");
  });
});
