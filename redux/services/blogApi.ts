import { api } from "./api";

// Types
export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  coverImage?: string;
  publishedAt: string;
  tags: string[];
  readTime: number;
  likesCount: number;
  commentsCount: number;
}

export interface BlogListResponse {
  blogs: Blog[];
  totalCount: number;
  nextCursor?: string;
}

export interface BlogQueryParams {
  query?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

// Define a service using a base URL and expected endpoints
export const blogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all blogs with optional filters
    getBlogs: builder.query<BlogListResponse, BlogQueryParams>({
      query: (params) => ({
        url: "/blogs",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.blogs.map(({ id }) => ({ type: "Blogs" as const, id })),
              { type: "Blogs", id: "LIST" },
            ]
          : [{ type: "Blogs", id: "LIST" }],
    }),

    // Get a single blog by ID
    getBlogById: builder.query<Blog, string>({
      query: (id) => `/blogs/${id}`,
      providesTags: (_, __, id) => [{ type: "Blogs", id }],
    }),

    // Search blogs
    searchBlogs: builder.query<BlogListResponse, string>({
      query: (query) => ({
        url: "/blogs/search",
        params: { query },
      }),
      providesTags: [{ type: "Blogs", id: "SEARCH" }],
    }),

    // Get blogs by tag
    getBlogsByTag: builder.query<BlogListResponse, string>({
      query: (tag) => ({
        url: "/blogs/tag",
        params: { tag },
      }),
      providesTags: (_, __, tag) => [{ type: "Tags", id: tag }],
    }),

    // Get blog comments
    getBlogComments: builder.query<Comment[], string>({
      query: (blogId) => `/blogs/${blogId}/comments`,
      providesTags: (result, _, blogId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Comments" as const, id })),
              { type: "Comments", id: blogId },
            ]
          : [{ type: "Comments", id: blogId }],
    }),

    // Add a comment to a blog
    addComment: builder.mutation<Comment, { blogId: string; content: string }>({
      query: ({ blogId, content }) => ({
        url: `/blogs/${blogId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_, __, { blogId }) => [
        { type: "Comments", id: blogId },
      ],
    }),

    // Get bookmarked blogs
    getBookmarkedBlogs: builder.query<BlogListResponse, void>({
      query: () => "/bookmarks",
      providesTags: [{ type: "Bookmarks", id: "LIST" }],
    }),

    // Toggle bookmark status for a blog
    toggleBookmark: builder.mutation<{ bookmarked: boolean }, string>({
      query: (blogId) => ({
        url: `/bookmarks/${blogId}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Bookmarks", id: "LIST" }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetBlogsQuery,
  useGetBlogByIdQuery,
  useSearchBlogsQuery,
  useGetBlogsByTagQuery,
  useGetBlogCommentsQuery,
  useAddCommentMutation,
  useGetBookmarkedBlogsQuery,
  useToggleBookmarkMutation,
} = blogApi;
