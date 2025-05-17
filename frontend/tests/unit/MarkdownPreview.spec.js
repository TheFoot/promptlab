import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import MarkdownPreview from "../../src/components/MarkdownPreview.vue";
import alertService from "../../src/services/alertService";
import {
  renderMarkdown,
  downloadCodeBlock,
} from "../../src/services/markdownService";

// Mock dependencies
vi.mock("../../src/services/alertService", () => ({
  default: {
    showAlert: vi.fn(),
  },
}));

vi.mock("../../src/services/markdownService", () => ({
  renderMarkdown: vi.fn(),
  downloadCodeBlock: vi.fn(),
}));

describe("MarkdownPreview.vue", () => {
  // Store original window.downloadCodeBlock if it exists
  const originalDownloadCodeBlock = window.downloadCodeBlock;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default mock implementation for renderMarkdown
    renderMarkdown.mockImplementation((content) => {
      if (!content) return "";
      return `<p>Rendered: ${content}</p>`;
    });

    // Reset window.downloadCodeBlock before each test
    window.downloadCodeBlock = undefined;
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = "";

    // Restore original window.downloadCodeBlock
    window.downloadCodeBlock = originalDownloadCodeBlock;
  });

  // Basic rendering tests
  describe("Basic rendering", () => {
    it("renders empty preview message when content is not provided", () => {
      const wrapper = mount(MarkdownPreview);

      expect(wrapper.find(".empty-preview").exists()).toBe(true);
      expect(wrapper.find(".empty-preview").text()).toBe(
        "No content to preview.",
      );
      expect(wrapper.find(".markdown-content").exists()).toBe(false);
    });

    it("renders markdown content when content is provided", () => {
      renderMarkdown.mockReturnValue("<p>Test Content</p>");

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "# Test Content",
        },
      });

      expect(wrapper.find(".empty-preview").exists()).toBe(false);
      expect(wrapper.find(".markdown-content").exists()).toBe(true);
      expect(wrapper.find(".markdown-content").html()).toContain(
        "<p>Test Content</p>",
      );
      expect(renderMarkdown).toHaveBeenCalledWith("# Test Content");
    });
  });

  // Computed property tests
  describe("renderedMarkdown computed property", () => {
    it("returns empty string when content is empty", () => {
      const wrapper = mount(MarkdownPreview);

      expect(wrapper.vm.renderedMarkdown).toBe("");
      expect(renderMarkdown).toHaveBeenCalledWith("");
    });

    it("uses renderMarkdown to convert markdown to HTML", () => {
      renderMarkdown.mockReturnValue("<h1>Heading</h1><p>Paragraph</p>");

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "# Heading\n\nParagraph",
        },
      });

      expect(wrapper.vm.renderedMarkdown).toBe(
        "<h1>Heading</h1><p>Paragraph</p>",
      );
      expect(renderMarkdown).toHaveBeenCalledWith("# Heading\n\nParagraph");
    });

    it("handles null value from renderMarkdown by returning empty string", () => {
      renderMarkdown.mockReturnValue(null);

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "Some content",
        },
      });

      expect(wrapper.vm.renderedMarkdown).toBe("");
    });
  });

  // Download functionality tests
  describe("Download functionality", () => {
    it("initializes window.downloadCodeBlock on mount", () => {
      mount(MarkdownPreview);

      expect(window.downloadCodeBlock).toBeDefined();
      expect(typeof window.downloadCodeBlock).toBe("function");
    });

    it("shows success alert when download succeeds", () => {
      // Setup return value for successful download
      downloadCodeBlock.mockReturnValue({ success: true, filename: "test.js" });

      // Mount the component to set up window.downloadCodeBlock
      mount(MarkdownPreview);

      // Create a mock button element
      const mockButton = document.createElement("button");
      mockButton.setAttribute("data-filename", "test.js");

      // Call the function
      window.downloadCodeBlock(mockButton);

      // Verify alertService was called correctly
      expect(alertService.showAlert).toHaveBeenCalledWith(
        "Downloading test.js",
        "success",
        3000,
      );
    });

    it("shows error alert when download fails", () => {
      // Setup return value for failed download
      downloadCodeBlock.mockReturnValue({ success: false });

      // Mount the component to set up window.downloadCodeBlock
      mount(MarkdownPreview);

      // Create a mock button element
      const mockButton = document.createElement("button");

      // Call the function
      window.downloadCodeBlock(mockButton);

      // Verify alertService was called correctly
      expect(alertService.showAlert).toHaveBeenCalledWith(
        "Failed to download code",
        "error",
        3000,
      );
    });

    it("doesn't replace existing window.downloadCodeBlock if already defined", () => {
      // Set a mock function
      const mockFn = vi.fn();
      window.downloadCodeBlock = mockFn;

      // Mount the component
      mount(MarkdownPreview);

      // Verify the original function was preserved
      expect(window.downloadCodeBlock).toBe(mockFn);
    });
  });

  // Lifecycle hook tests
  describe("Lifecycle hooks", () => {
    it("preserves window.downloadCodeBlock on unmount", async () => {
      // Mount the component
      const wrapper = mount(MarkdownPreview);

      // Store reference to function
      const downloadFn = window.downloadCodeBlock;

      // Unmount component
      await wrapper.unmount();

      // Verify the function is still available
      expect(window.downloadCodeBlock).toBe(downloadFn);
    });
  });

  // Markdown rendering scenarios
  describe("Markdown rendering scenarios", () => {
    it("renders code blocks with syntax highlighting", () => {
      // Mock HTML containing a code block
      const codeBlockHtml = `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-language">javascript</span>
            <button class="code-download-btn" data-code="console.log('test')" data-filename="code-123.js"></button>
          </div>
          <pre><code class="hljs javascript">console.log('test')</code></pre>
        </div>
      `;

      renderMarkdown.mockReturnValue(codeBlockHtml);

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "```javascript\nconsole.log('test')\n```",
        },
      });

      expect(wrapper.find(".markdown-content").html()).toContain(
        "code-block-wrapper",
      );
      expect(wrapper.find(".markdown-content").html()).toContain(
        "code-download-btn",
      );
    });

    it("renders tables correctly", () => {
      // Mock HTML containing a table
      const tableHtml = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>
      `;

      renderMarkdown.mockReturnValue(tableHtml);

      const wrapper = mount(MarkdownPreview, {
        props: {
          content:
            "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |",
        },
      });

      expect(wrapper.find(".markdown-content").html()).toContain("table");
      expect(wrapper.find(".markdown-content").html()).toContain(
        "<th>Header 1</th>",
      );
    });

    it("renders lists correctly", () => {
      // Mock HTML containing a list
      const listHtml = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;

      renderMarkdown.mockReturnValue(listHtml);

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "- Item 1\n- Item 2",
        },
      });

      expect(wrapper.find(".markdown-content").html()).toContain("<ul>");
      expect(wrapper.find(".markdown-content").html()).toContain(
        "<li>Item 1</li>",
      );
    });
  });

  // Error handling
  describe("Error handling", () => {
    it("handles errors during markdown rendering", () => {
      // Instead of throwing directly, we mock the error handling that happens in markdownService
      renderMarkdown.mockReturnValue(
        "<p class='error'>Error rendering markdown: Test error</p>",
      );

      const wrapper = mount(MarkdownPreview, {
        props: {
          content: "# Test content",
        },
      });

      // Component should render the error message from markdownService
      expect(wrapper.find(".markdown-content").html()).toContain(
        "Error rendering markdown",
      );
      expect(renderMarkdown).toHaveBeenCalled();
    });
  });
});
