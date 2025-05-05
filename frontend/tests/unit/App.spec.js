import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "../../src/App.vue";

// Mock the APP_VERSION global variable
vi.stubGlobal("__APP_VERSION__", "0.9.0-test");

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock router-view component
const routerViewStub = {
  name: "RouterView",
  template: '<div class="router-view-stub"></div>',
};

// Mock AlertSystem component
vi.mock("../../src/components/AlertSystem.vue", () => ({
  default: {
    name: "AlertSystem",
    template: '<div class="alert-system-stub"></div>',
  },
}));

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: { template: "<div>Home</div>" } }],
});

describe("App.vue", () => {
  it("renders the application shell with router-view", () => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Mount App component
    const wrapper = shallowMount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: routerViewStub,
        },
      },
    });

    // Check app structure
    expect(wrapper.find(".app").exists()).toBe(true);
    expect(wrapper.find(".router-view-stub").exists()).toBe(true);
  });
});
