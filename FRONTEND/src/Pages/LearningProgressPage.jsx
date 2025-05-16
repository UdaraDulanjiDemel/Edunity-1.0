import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import LearningProgressCard from "../components/LearningProgressCard";
import EditLearningProgressModal from "../components/EditLearningProgressModal";
import useConfirmModal from "../hooks/useConfirmModal";
import ConfirmModal from "../components/ConfirmModal";
import {
  createLearningProgress,
  getAllLearningProgress,
  deleteLearningProgress,
  addLike,
  removeLike,
  addComment,
} from "../api/learningProgressAPI";

// Status options
const STATUS_OPTIONS = [
  {
    id: "not_started",
    name: "Not Started",
    color: "bg-gray-100 text-gray-800",
  },
  {
    id: "in_progress",
    name: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  { id: "completed", name: "Completed", color: "bg-green-100 text-green-800" },
];

// Templates
const TEMPLATES = [
  {
    id: "general",
    name: "General Progress",
    icon: "📝",
    fields: ["title", "description", "skillsLearned"],
  },
  {
    id: "tutorial",
    name: "Tutorial Completion",
    icon: "🎓",
    fields: ["title", "tutorialName", "skillsLearned", "challenges"],
  },
  {
    id: "project",
    name: "Project Milestone",
    icon: "🏆",
    fields: [
      "title",
      "projectName",
      "description",
      "skillsLearned",
      "nextSteps",
    ],
  },
];

const LearningProgressPage = () => {
  const { currentUser } = useAuth();
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [selectedStatus, setSelectedStatus] = useState(STATUS_OPTIONS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  const { modalState, openModal, closeModal } = useConfirmModal();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      tutorialName: "",
      projectName: "",
      skillsLearned: "",
      challenges: "",
      nextSteps: "",
    },
  });

  useEffect(() => {
    fetchProgressEntries();
  }, []);

  const fetchProgressEntries = async () => {
    setLoading(true);
    try {
      const response = await getAllLearningProgress(currentUser?.token);
      setProgressEntries(response.data);
    } catch (error) {
      console.error("Error fetching learning progress entries:", error);
      toast.error("Failed to load learning progress entries");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
    reset({
      title: "",
      description: "",
      tutorialName: "",
      projectName: "",
      skillsLearned: "",
      challenges: "",
      nextSteps: "",
    });
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleProgressSubmit = async (data) => {
    if (!currentUser) {
      toast.error("You must be logged in to share progress");
      return;
    }

    const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);
    const requiredFields = currentTemplate.fields.filter(
      (field) =>
        field === "title" ||
        field === "description" ||
        field === "tutorialName" ||
        field === "projectName"
    );

    const isValid = requiredFields.every((field) => data[field]?.trim());
    if (!isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const progressData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userProfileImage: currentUser.profileImage,
        templateType: selectedTemplate,
        status: selectedStatus,
        ...data,
      };

      const response = await createLearningProgress(
        currentUser.id,
        progressData,
        currentUser.token
      );

      toast.success("Progress shared successfully");

      setProgressEntries([response.data, ...progressEntries]);

      reset();
      setSelectedTemplate(TEMPLATES[0].id);
      setSelectedStatus(STATUS_OPTIONS[0].id);
    } catch (error) {
      console.error("Error creating learning progress:", error);
      toast.error("Failed to share progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (progressId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like this progress");
      return;
    }

    try {
      const isLiked = progressEntries
        .find((p) => p.id === progressId)
        ?.likes?.some((like) => like.userId === currentUser.id);

      if (isLiked) {
        // Unlike
        await removeLike(progressId, currentUser.id, currentUser.token);

        // Update state
        setProgressEntries(
          progressEntries.map((entry) => {
            if (entry.id === progressId) {
              return {
                ...entry,
                likes: entry.likes.filter(
                  (like) => like.userId !== currentUser.id
                ),
              };
            }
            return entry;
          })
        );
      } else {
        // Like
        const likeData = { userId: currentUser.id };
        const response = await addLike(progressId, likeData, currentUser.token);

        // Update state
        setProgressEntries(
          progressEntries.map((entry) => {
            if (entry.id === progressId) {
              return response.data;
            }
            return entry;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to process like");
    }
  };

  const handleAddComment = async (progressId, commentData) => {
    if (!currentUser) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      const response = await addComment(
        progressId,
        commentData,
        currentUser.token
      );

      // Update state
      setProgressEntries(
        progressEntries.map((entry) => {
          if (entry.id === progressId) {
            return response.data;
          }
          return entry;
        })
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      throw error;
    }
  };

  const handleUpdateComment = async (progressId, commentId, updatedContent) => {
    setProgressEntries(
      progressEntries.map((progressEntry) => {
        if (progressEntry.id === progressId) {
          return {
            ...progressEntry,
            comments: progressEntry.comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  content: updatedContent,
                  updatedAt: new Date(),
                };
              }
              return comment;
            }),
          };
        }
        return progressEntry;
      })
    );
  };

  const handleDeleteComment = async (progressId, commentId) => {
    setProgressEntries(
      progressEntries.map((progressEntry) => {
        if (progressEntry.id === progressId) {
          return {
            ...progressEntry,
            comments: progressEntry.comments.filter(
              (comment) => comment.id !== commentId
            ),
          };
        }
        return progressEntry;
      })
    );
  };

  const handleEdit = (progress) => {
    setEditingProgress(progress);
  };

  const handleProgressUpdated = async () => {
    await fetchProgressEntries();
    setEditingProgress(null);
  };

  const handleDelete = (progressId) => {
    openModal({
      title: "Delete Learning Progress",
      message:
        "Are you sure you want to delete this learning progress? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteLearningProgress(progressId, currentUser.token);

          // Update state
          setProgressEntries(
            progressEntries.filter((entry) => entry.id !== progressId)
          );

          toast.success("Learning progress deleted");
        } catch (error) {
          console.error("Error deleting learning progress:", error);
          toast.error("Failed to delete learning progress");
        }
      },
    });
  };

  // Get the current template object
  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      {/* Create Progress Update Form */}
      <motion.div
        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-white border-opacity-30 mb-8 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-gray-200 border-opacity-30 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-2xl font-bold text-white">
            Share Your Learning Progress
          </h2>
          <p className="text-blue-100 mt-1">Track and share your learning journey with the community</p>
        </div>

        <form onSubmit={handleSubmit(handleProgressSubmit)} className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Template Type */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Progress Type
              </label>
              <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300"
                disabled={isSubmitting}
              >
                {TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300"
                disabled={isSubmitting}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Form Fields based on selected template */}
          <div className="space-y-6">
            {currentTemplate.fields.includes("title") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  placeholder="Give your progress update a clear title"
                  className={`w-full p-3 bg-white rounded-xl border ${
                    errors.title ? "border-red-500" : "border-gray-200"
                  } focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300`}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-500 font-medium">
                    {errors.title.message}
                  </p>
                )}
              </div>
            )}

            {currentTemplate.fields.includes("description") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description*
                </label>
                <textarea
                  {...register("description", {
                    required: currentTemplate.fields.includes("description")
                      ? "Description is required"
                      : false,
                  })}
                  placeholder="Describe what you've learned or accomplished"
                  rows="3"
                  className={`w-full p-3 bg-white rounded-xl border ${
                    errors.description ? "border-red-500" : "border-gray-200"
                  } focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300 resize-none`}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-500 font-medium">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}

            {currentTemplate.fields.includes("tutorialName") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tutorial Name*
                </label>
                <input
                  type="text"
                  {...register("tutorialName", {
                    required: currentTemplate.fields.includes("tutorialName")
                      ? "Tutorial name is required"
                      : false,
                  })}
                  placeholder="Name of the tutorial you completed"
                  className={`w-full p-3 bg-white rounded-xl border ${
                    errors.tutorialName ? "border-red-500" : "border-gray-200"
                  } focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300`}
                  disabled={isSubmitting}
                />
                {errors.tutorialName && (
                  <p className="mt-2 text-sm text-red-500 font-medium">
                    {errors.tutorialName.message}
                  </p>
                )}
              </div>
            )}

            {currentTemplate.fields.includes("projectName") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name*
                </label>
                <input
                  type="text"
                  {...register("projectName", {
                    required: currentTemplate.fields.includes("projectName")
                      ? "Project name is required"
                      : false,
                  })}
                  placeholder="Name of your project"
                  className={`w-full p-3 bg-white rounded-xl border ${
                    errors.projectName ? "border-red-500" : "border-gray-200"
                  } focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300`}
                  disabled={isSubmitting}
                />
                {errors.projectName && (
                  <p className="mt-2 text-sm text-red-500 font-medium">
                    {errors.projectName.message}
                  </p>
                )}
              </div>
            )}

            {currentTemplate.fields.includes("skillsLearned") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skills Learned
                </label>
                <input
                  type="text"
                  {...register("skillsLearned")}
                  placeholder="Skills or technologies you learned (comma-separated)"
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {currentTemplate.fields.includes("challenges") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Challenges Faced
                </label>
                <textarea
                  {...register("challenges")}
                  placeholder="What challenges did you encounter and how did you overcome them?"
                  rows="2"
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {currentTemplate.fields.includes("nextSteps") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Next Steps
                </label>
                <textarea
                  {...register("nextSteps")}
                  placeholder="What are your next steps or goals?"
                  rows="2"
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm transition-all duration-200 hover:border-blue-300 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sharing...
                </span>
              ) : (
                "Share Progress"
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Progress Entries Feed */}
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search progress updates..."
            className="w-full p-2 bg-white bg-opacity-70 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            onChange={(e) => {
          const searchTerm = e.target.value.toLowerCase();
          if (searchTerm === "") {
            fetchProgressEntries(); // Fetch all entries when search query is cleared
          } else {
            setProgressEntries((prevEntries) =>
              prevEntries.filter((entry) =>
            entry.title.toLowerCase().includes(searchTerm)
              )
            );
          }
            }}
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : progressEntries.length === 0 ? (
          <motion.div
            className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-medium text-gray-700 mb-2">
          No progress updates yet
            </h3>
            <p className="text-gray-600">
          Start sharing your learning journey with the community!
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {progressEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <LearningProgressCard
              progress={entry}
              currentUser={currentUser}
              onLike={handleLike}
              onComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onUpdateComment={handleUpdateComment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              token={currentUser?.token}
            />
          </motion.div>
            ))}
          </motion.div>
        )}

        {/* Edit Progress Modal */}
      {editingProgress && (
        <EditLearningProgressModal
          progressEntry={editingProgress}
          onClose={() => setEditingProgress(null)}
          onProgressUpdated={handleProgressUpdated}
          token={currentUser?.token}
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

export default LearningProgressPage;
