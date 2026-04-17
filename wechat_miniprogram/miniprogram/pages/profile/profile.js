const mockData = require('../../data/mockData');

Page({
  data: {
    userName: mockData.user.name,
    userGrade: mockData.user.grade,
    userMajor: mockData.user.major,
    userGoal: mockData.user.goal,
    stats: {
      followed: mockData.user.followedCount,
      registered: mockData.user.registeredCount,
      awards: mockData.user.awardCount
    },
    certificates: [
      { name: '第十四届蓝桥杯全国软件和信息技术专业人才大赛', level: '国家级二等奖', date: '2023-06' },
      { name: '2023年全国大学生数学建模竞赛', level: '省级一等奖', date: '2023-09' }
    ]
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '极客档案',
    });
  },

  onEditProfile: function() {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  onShareAppMessage: function() {
    return {
      title: '快来看看我的竞赛作品集！',
      path: '/pages/profile/profile'
    };
  }
})
