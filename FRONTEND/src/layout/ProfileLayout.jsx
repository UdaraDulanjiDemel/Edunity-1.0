import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MapPin, Calendar } from "lucide-react";
import { useAuth } from "../context/auth";
import UserAvatar from "../components/UserAvatar";

const ProfileLayout = ({
  children,
  actionButtons,
  profileUser,
  isLoading,
  onShowFollowers,
  onShowFollowing,
  totalPostCount = 0,
}) => {
  const navigate = useNavigate();
  useAuth();
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsAnimated(true);
    }
  }, [isLoading]);

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* <Header /> */}
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-10">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* <Header /> */}

      {/* Profile Header with Cover and Avatar */}
      <div className="w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 h-72 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-30"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 h-full relative">
          <button
            onClick={goBack}
            className="absolute left-4 top-4 z-10 p-2.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all text-gray-800 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative">
        {/* Main Content */}
        <motion.div
          className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl border border-white border-opacity-30 p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isAnimated ? 1 : 0, y: isAnimated ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Avatar and Top Info */}
          <div className="flex flex-col md:flex-row md:items-end">
            <div className="flex flex-col items-center md:items-start md:flex-row md:space-x-8">
              {/* Avatar */}
              <motion.div
                className="border-4 border-white shadow-xl -mt-36 mb-4 md:mb-0 relative z-10 rounded-full transform hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 blur-sm"></div>
                <UserAvatar
                  src={profileUser?.profileImage}
                  alt={profileUser?.name}
                  name={profileUser?.name}
                  size="h-44 w-44"
                  className="bg-white"
                />
              </motion.div>

              <div className="text-center md:text-left flex-grow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profileUser?.name}
                    </h1>
                    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-blue-500" />
                        <p className="text-lg">{profileUser?.email}</p>
                      </div>
                      {profileUser?.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-blue-500" />
                          <p className="text-lg">{profileUser.location}</p>
                        </div>
                      )}
                      {profileUser?.joinDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-blue-500" />
                          <p className="text-lg">Joined {new Date(profileUser.joinDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {profileUser?.bio && (
                      <p className="mt-4 text-gray-700 max-w-xl text-lg leading-relaxed">
                        {profileUser.bio}
                      </p>
                    )}
                  </div>

                  {/* Action buttons passed from ProfilePage */}
                  <div className="mt-6 md:mt-0 flex justify-center md:justify-end space-x-3">
                    {actionButtons}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gray-200 pt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center py-4 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all duration-300 group"
            >
              <span className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {totalPostCount || 0}
              </span>
              <span className="text-sm text-gray-600 font-medium mt-1">Posts</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowFollowers}
              className="flex flex-col items-center py-4 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all duration-300 cursor-pointer group"
            >
              <span className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {profileUser?.followedUsers?.length || 0}
              </span>
              <span className="text-sm text-gray-600 font-medium mt-1">Followers</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowFollowing}
              className="flex flex-col items-center py-4 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all duration-300 cursor-pointer group"
            >
              <span className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {profileUser?.followingUsers?.length || 0}
              </span>
              <span className="text-sm text-gray-600 font-medium mt-1">Following</span>
            </motion.button>
          </div>

          {/* Skills Tags */}
          {profileUser?.skills && profileUser.skills.length > 0 && (
            <div className="mt-10 border-t border-gray-200 pt-8">
              <p className="text-xl font-semibold text-gray-800 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Skills & Expertise</p>
              <div className="flex flex-wrap gap-3">
                {profileUser.skills.map((skill, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Child Content */}
        {children}
      </div>
    </div>
  );
};

export default ProfileLayout;
