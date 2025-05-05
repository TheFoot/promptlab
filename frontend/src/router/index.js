import { createRouter, createWebHistory } from "vue-router";

// Import views
import HomeView from "../views/HomeView.vue";
import PromptDetailView from "../views/PromptDetailView.vue";
import PromptCreateView from "../views/PromptCreateView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
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

export default router;
