import { useState } from "react";

const PostCard = ({
  post,
  currentUser,
  onLike,
  onComment,
  onDeleteComment,
  onUpdateComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onComment(post.id, commentText);
    setCommentText("");
  };

  const isLikedByUser = post.likes?.some(
    (like) => like.userId === currentUser?.id
  );

  