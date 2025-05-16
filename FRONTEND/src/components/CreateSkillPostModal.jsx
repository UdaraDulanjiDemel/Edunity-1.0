import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Video } from "lucide-react";
import { useAuth } from "../context/auth";
import { createPost } from "../api/skillSharingAPI";
import toast from "react-hot-toast";

const CreatePostForm = ({ onPostCreated }) => {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      toast.error("You can only upload up to 3 files");
      return;
    }

    setIsProcessingFiles(true);
    const newPreviewUrls = [];
    const newFiles = [];

    for (const file of selectedFiles) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        if (file.type.startsWith("video/") && file.size > 30 * 1024 * 1024) {
          toast.error("Video size should be less than 30MB");
          continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviewUrls.push({
            url: e.target.result,
            type: file.type.startsWith("video/") ? "video" : "image",
          });
          setPreviewUrls([...newPreviewUrls]);
        };
        reader.readAsDataURL(file);
        newFiles.push(file);
      } else {
        toast.error("Only images and videos are allowed");
      }
    }

    setFiles(newFiles);
    setIsProcessingFiles(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() && files.length === 0) {
      toast.error("Please add a description or media");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      files.forEach((file) => {
        formData.append("files", file);
      });

      await createPost(formData, currentUser.token);
      toast.success("Post created successfully!");
      setDescription("");
      setFiles([]);
      setPreviewUrls([]);
      onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviewUrls = [...previewUrls];
    newFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    setFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white bg-opacity-30 backdrop-blur-lg rounded-xl shadow-md border border-white border-opacity-30 p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your skills and experiences..."
            className="w-full px-4 py-3 bg-white bg-opacity-40 rounded-xl border border-white border-opacity-30 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none min-h-[100px]"
            disabled={isSubmitting || isProcessingFiles}
          />

          {/* Preview Section */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewUrls.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-black bg-opacity-10"
                >
                  {preview.type === "video" ? (
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <motion.button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              isSubmitting || isProcessingFiles
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white bg-opacity-40 cursor-pointer hover:bg-opacity-60"
            }`}
          >
            <span className="text-lg">📷</span>
            <span className="text-gray-700">
              {isProcessingFiles ? "Processing..." : "Add Photos/Videos"}
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting || isProcessingFiles}
              ref={fileInputRef}
            />
          </label>

          <motion.button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium"
            whileHover={{ scale: isSubmitting || isProcessingFiles ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || isProcessingFiles ? 1 : 0.98 }}
            disabled={isSubmitting || isProcessingFiles}
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
              "Share"
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePostForm;