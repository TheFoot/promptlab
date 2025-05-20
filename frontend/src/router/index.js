import { createRouter, createWebHistory } from "vue-router";
import { usePromptStore } from "../stores/promptStore";

// Import views
import HomeView from "../views/HomeView.vue";
import PromptDetailView from "../views/PromptDetailView.vue";
import PromptCreateView from "../views/PromptCreateView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      clearPrompt: true
    }
  },
  {
    path: "/prompts/new",
    name: "prompt-create",
    component: PromptCreateView,
  },
  {
    path: "/prompts/:id",
    name: "prompt-detail",
    component: PromptDetailView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Clear current prompt when navigating to routes that need it cleared
  if (to.meta.clearPrompt) {
    const promptStore = usePromptStore();
    promptStore.currentPrompt = null;
  }
  next();
});

export default router;
