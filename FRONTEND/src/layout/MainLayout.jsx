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
    { icon: <Users size={18} />, label: "My Network", path:  `/profile/${currentUser?.id}` },
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
                  People You Know 
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
