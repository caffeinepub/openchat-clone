import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";
import ConversationsPage from "./pages/ConversationsPage";

// Lazy-load heavier pages
const ConversationDetailPage = lazy(
  () => import("./pages/ConversationDetailPage"),
);
const NewDMPage = lazy(() => import("./pages/NewDMPage"));
const NewGroupPage = lazy(() => import("./pages/NewGroupPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const PostRoomPage = lazy(() => import("./pages/PostRoomPage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const CatalogRoomPage = lazy(() => import("./pages/CatalogRoomPage"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/conversations" });
  },
});

const conversationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversations",
  component: ConversationsPage,
});

const conversationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversations/$id",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ConversationDetailPage />
    </Suspense>
  ),
});

const newDMRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversations/new/dm",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <NewDMPage />
    </Suspense>
  ),
});

const newGroupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conversations/new/group",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <NewGroupPage />
    </Suspense>
  ),
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <UserProfilePage />
    </Suspense>
  ),
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <FeedPage />
    </Suspense>
  ),
});

const postRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed/$postId",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PostRoomPage />
    </Suspense>
  ),
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CatalogPage />
    </Suspense>
  ),
});

const catalogRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog/$roomId",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CatalogRoomPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  conversationsRoute,
  conversationDetailRoute,
  newDMRoute,
  newGroupRoute,
  userProfileRoute,
  feedRoute,
  postRoomRoute,
  catalogRoute,
  catalogRoomRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
