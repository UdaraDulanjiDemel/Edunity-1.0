import { useState, useEffect } from "react";
import { Heart, MessageSquare, Edit, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import {
  getAllPosts,
  addLike,
  removeLike,
  addComment,
  deletePost,
} from "../api/skillSharingAPI";
import useConfirmModal from "../hooks/useConfirmModal";
import CreatePostForm from "../components/CreateSkillPostModal";
import Comment, { CommentForm } from "../components/CommentComponent";
import EditPostModal from "../components/EditSkillPostModal";
import ConfirmModal from "../components/ConfirmModal";
import { Link } from "react-router-dom";

const SkillSharingFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showComments, setShowComments] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const { modalState, openModal, closeModal } = useConfirmModal();

  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await getAllPosts(currentUser?.token);
      setPosts(response.data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostUpdated = () => {
    fetchPosts();
    setEditingPost(null);
  };

  const handleDeletePost = async (postId) => {
    const post = posts.find((p) => p.id === postId);

    openModal({
      title: "Delete Post",
      message:
        "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await deletePost(postId, currentUser?.token);
          setPosts(posts.filter((post) => post.id !== postId));
          toast.success("Post deleted successfully");
        } catch (error) {
          console.error("Error deleting post:", error);
          toast.error("Failed to delete post");
        }
      },
    });
  };

  const handleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    const isLiked = post?.likes?.some(
      (like) => like.userId === currentUser?.id
    );

    const originalPosts = [...posts];

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          if (isLiked) {
            return {
              ...post,
              likes: post.likes.filter(
                (like) => like.userId !== currentUser.id
              ),
            };
          } else {
            return {
              ...post,
              likes: [
                ...(post.likes || []),
                { userId: currentUser.id, createdAt: new Date() },
              ],
            };
          }
        }
        return post;
      })
    );

    try {
      // Make the API call after UI is already updated
      if (isLiked) {
        await removeLike(postId, currentUser.id, currentUser.token);
      } else {
        const likeData = { userId: currentUser.id };
        await addLike(postId, likeData, currentUser.token);
      }
      // If successful, we keep the UI as is (already updated)
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to process like");

      // Revert to original state if API call fails
      setPosts(originalPosts);
    }
  };

  const toggleComments = (postId) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId],
    });
  };

  const handleAddComment = async (postId, commentData) => {
    try {
      const response = await addComment(postId, commentData, currentUser.token);

      // Update the posts state with the updated post from the response
      setPosts(
        posts.map((post) => (post.id === postId ? response.data : post))
      );

      return response;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      throw error;
    }
  };

  const handleCommentUpdated = (postId, commentId, newContent) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  content: newContent,
                  updatedAt: new Date(),
                };
              }
              return comment;
            }),
          };
        }
        return post;
      })
    );
  };

  const handleCommentDeleted = (postId, commentId) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter(
              (comment) => comment.id !== commentId
            ),
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Create Post Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CreatePostForm onPostCreated={handlePostCreated} />
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-white bg-opacity-30 backdrop-blur-lg rounded-xl border border-white border-opacity-30 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </motion.div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex justify-center items-center my-12">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <motion.div
          className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No posts found
          </h3>
          <p className="text-gray-600">
            Try searching for something else or create a new post!
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{
                y: -5,
                boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Post Header with User Info and Action Buttons */}
              <div className="p-4 flex items-center justify-between border-b border-gray-100 border-opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white overflow-hidden">
                    {post.userProfileImage ? (
                      <img
                        src={post.userProfileImage}
                        alt={post.userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium">
                        {post.userName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link to={'/profile/${post.userId}'} target="_blank">
                      <h3 className="font-medium text-gray-800 hover:underline">
                        {post.userName}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Post Owner Actions */}
                {post.userId === currentUser?.id && (
                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => setEditingPost(post)}
                      className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={18} />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash size={18} />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="text-gray-800 mb-4">{post.description}</p>
                {/* Media Content */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div
                    className={`grid gap-2 mb-4 ${
                      post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {post.mediaUrls.map((urlString, index) => {
                      let mediaObject;
                      let isVideo = false;
                      let url = urlString;

                      try {
                        mediaObject = JSON.parse(urlString);
                        url = mediaObject.dataUrl;
                        isVideo = mediaObject.type === "video";
                      } catch (error) {
                        isVideo =
                          urlString.includes("video") ||
                          urlString.includes("data:video/");
                      }

                      return (
                        <div
                          key={index}
                          className="rounded-lg overflow-hidden bg-black bg-opacity-10"
                        >
                          {isVideo ? (
                            <video
                              controls
                              src={url}
                              className="w-full h-full object-contain max-h-80"
                            />
                          ) : (
                            <img
                              src={url}
                              alt="Post content"
                              className="w-full h-full object-contain max-h-80"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 mt-4">
                  <motion.button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1 ${
                      post.likes?.some((like) => like.userId === currentUser?.id)
                        ? "text-red-500"
                        : "text-gray-500 hover:text-red-500"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart
                      size={20}
                      fill={
                        post.likes?.some(
                          (like) => like.userId === currentUser?.id
                        )
                          ? "currentColor"
                          : "none"
                      }
                    />
                    <span>{post.likes?.length || 0}</span>
                  </motion.button>

                  <motion.button
                    onClick={() =>
                      setShowComments({
                        ...showComments,
                        [post.id]: !showComments[post.id],
                      })
                    }
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageSquare size={20} />
                    <span>{post.comments?.length || 0}</span>
                  </motion.button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {showComments[post.id] && (
                    <motion.div
                      className="mt-3 space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Add Comment Form */}
                      <CommentForm
                        postId={post.id}
                        onAddComment={handleAddComment}
                        currentUser={currentUser}
                      />

                      {/* Comments List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map((comment) => (
                            <Comment
                              key={comment.id}
                              comment={comment}
                              postId={post.id}
                              currentUser={currentUser}
                              postUserId={post.userId}
                              onCommentUpdated={handleCommentUpdated}
                              onCommentDeleted={handleCommentDeleted}
                              token={currentUser.token}
                              commentType="SKILL_SHARING"
                            />
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-2">
                            No comments yet
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onPostUpdated={handlePostUpdated}
          token={currentUser.token}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmButtonClass={modalState.confirmButtonClass}
        type={modalState.type}
      />
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Users, Compass, Bookmark, Hash, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import { useAuth } from "../context/auth/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { getAllUsers, followUser, unfollowUser } from "../api/profileAPI.js";
import toast from "react-hot-toast";

const trendingTopics = [
  { id: 1, name: "React Hooks", count: 342 },
  { id: 2, name: "CSS Grid", count: 275 },
  { id: 3, name: "UX Design", count: 189 },
  { id: 4, name: "Python", count: 156 },
];

const MainLayout = ({ children, activeTab }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followStates, setFollowStates] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  

  const handleIgnore = (userId) => {
    setSuggestedUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast.success("User removed from suggestions");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        // Filter out the current user from the list
        const filteredUsers = users.filter(user => user.id !== currentUser?.id);
        setSuggestedUsers(filteredUsers);

        // Initialize follow states
        const initialFollowStates = {};
        filteredUsers.forEach((user) => {
          initialFollowStates[user.id] = currentUser?.followingUsers?.includes(user.id) || false;
        });
        setFollowStates(initialFollowStates);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (currentUser) {
      setIsLoaded(true);
      fetchUsers();
    } else {
      setIsLoaded(false);
    }
  }, [currentUser]);

  const handleFollowToggle = async (userId) => {
    if (!currentUser) {
      toast.error("You must be logged in to follow users");
      navigate("/login");
      return;
    }

    try {
      if (followStates[userId]) {
        await unfollowUser(userId, currentUser?.token);
        toast.success("Unfollowed user");
      } else {
        await followUser(userId, currentUser?.token);
        toast.success("Now following user");
      }

      // Toggle follow state
      setFollowStates({
        ...followStates,
        [userId]: !followStates[userId],
      });
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast.error("Failed to update follow status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* header */}
      <Header activeTab={activeTab} />

      {/* main content with side columns */}
      <div className="pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* left side bar */}
          <motion.div
            className="hidden lg:block lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* user panel */}
            <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 overflow-hidden">
              <div className="p-4 border-b border-gray-100 border-opacity-40">
                <h3 className="font-semibold text-gray-800">Navigation</h3>
              </div>
              <div className="p-2">
              <div className="space-y-1">
  {[
    { icon: <User size={18} />, label: "My Profile", path: `/profile/${currentUser?.id}` },
    { icon: <Compass size={18} />, label: "Explore", path: "/plans" },
    { icon: <Users size={18} />, label: "My Network", path: `/profile/${currentUser?.id}` },
  ].map((item, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ x: 5 }}
    >
      <Link
        to={item.path}
        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-white hover:bg-opacity-50 transition-all duration-200"
      >
        <span className="text-blue-500">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    </motion.div>
  ))}
</div>
              </div>
            </div>

            {/* trending topics */}
            <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 overflow-hidden">
              <div className="p-4 border-b border-gray-100 border-opacity-40">
                <h3 className="font-semibold text-gray-800">Trending Topics</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {trendingTopics.map((topic, index) => (
                    <motion.div
                      key={topic.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white hover:bg-opacity-50 transition-all duration-200 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: isLoaded ? 1 : 0,
                        x: isLoaded ? 0 : -20,
                      }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center space-x-2">
                        <Hash size={16} className="text-blue-500" />
                        <span className="text-gray-800">{topic.name}</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {topic.count}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* main content */}
          <motion.div
            className="col-span-1 lg:col-span-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* here will render the specific tab content */}
            {children}
          </motion.div>

          {/* right side bar */}
          <motion.div
            className="hidden lg:block lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* People You May Know */}
            <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 overflow-hidden">
              <div className="p-4 border-b border-gray-100 border-opacity-40">
                <h3 className="font-semibold text-gray-800">
                  People You May Know
                </h3>
              </div>
              <div className="p-2">
                {suggestedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    className="p-3 hover:bg-white hover:bg-opacity-40 rounded-lg transition-all duration-200"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: isLoaded ? 1 : 0,
                      x: isLoaded ? 0 : 20,
                    }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white overflow-hidden">
                        <span className="text-lg font-medium">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">
                          {user.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {user.bio || 'No bio available'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.skills?.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button 
                        onClick={() => handleFollowToggle(user.id)}
                        className={`flex-1 py-1.5 ${
                          followStates[user.id]
                            ? "bg-gray-600 hover:bg-gray-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-white text-sm rounded-lg transition-colors`}
                      >
                        {followStates[user.id] ? "Following" : "Connect"}
                      </button>
                      <button 
                        onClick={() => handleIgnore(user.id)}
                        className="px-3 py-1.5 bg-white bg-opacity-70 text-gray-700 text-sm rounded-lg hover:bg-opacity-100 transition-colors"
                      >
                        Ignore
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* learning stat */}
            <div className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 overflow-hidden">
              <div className="p-4 border-b border-gray-100 border-opacity-40 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bookmark size={18} className="text-blue-500" />
                  Your Learning Stats
                </h3>
              </div>
              <div className="p-4">
                <motion.button
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.7 }}
                  onClick={() => navigate('/dashboard')}
                >
                  <Compass size={16} className="animate-pulse" />
                  View Detailed Stats
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;