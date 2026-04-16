// pages/index/index.js
import { competitions, hallOfFame } from './data.js';

Page({
  data: {
    activeTab: 'home',
    allCompetitions: [],
    filteredCompetitions: [],
    hallOfFame: [],
    userMajor: '计算机科学与技术',
    userGoal: '保研',
    userName: '张伟',
    userGrade: '大三',
    followedIds: [],
    registeredIds: [],
    searchQuery: ''
  },

  onLoad() {
    // 初始化数据
    this.setData({
      allCompetitions: this.processCompetitions(competitions),
      hallOfFame: hallOfFame
    });
    this.filterCompetitions();
  },

  processCompetitions(list) {
    const now = new Date();
    return list.map(comp => {
      const diff = new Date(comp.deadline).getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return {
        ...comp,
        daysLeft: days > 0 ? days : 0
      };
    });
  },

  switchTab(e) {
    this.setData({
      activeTab: e.currentTarget.dataset.tab
    });
  },

  onSearch(e) {
    this.setData({
      searchQuery: e.detail.value
    }, () => {
      this.filterCompetitions();
    });
  },

  filterCompetitions() {
    const { allCompetitions, searchQuery } = this.data;
    const filtered = allCompetitions.filter(comp => 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    this.setData({
      filteredCompetitions: filtered
    });
  },

  toggleFollow(e) {
    const id = e.currentTarget.dataset.id;
    let { followedIds } = this.data;
    if (followedIds.includes(id)) {
      followedIds = followedIds.filter(i => i !== id);
    } else {
      followedIds.push(id);
      wx.showToast({ title: '订阅成功', icon: 'success' });
    }
    this.setData({ followedIds });
  },

  showRecommendation() {
    wx.showModal({
      title: '智能推荐',
      content: `基于您的目标(${this.data.userGoal})和专业(${this.data.userMajor})，我们为您筛选了最匹配的5项竞赛。`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  openFilter() {
    wx.showActionSheet({
      itemList: ['全部', '综合', '理工', 'IT/软件', '文科'],
      success: (res) => {
        const categories = ['全部', '综合', '理工', 'IT/软件', '文科'];
        const selected = categories[res.tapIndex];
        wx.showToast({ title: `已筛选: ${selected}` });
        // 这里可以添加实际的过滤逻辑
      }
    });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const comp = this.data.allCompetitions.find(c => c.id === id);
    if (comp) {
      wx.showModal({
        title: comp.name,
        content: comp.description,
        confirmText: '立即报名',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            this.register({ currentTarget: { dataset: { url: comp.registrationUrl } } });
          }
        }
      });
    }
  },

  register(e) {
    const url = e.currentTarget.dataset.url;
    wx.showModal({
      title: '即将离开小程序',
      content: '是否前往外部报名链接？',
      success: (res) => {
        if (res.confirm) {
          // 小程序无法直接打开任意外部链接，通常需要配置业务域名或使用复制链接
          wx.setClipboardData({
            data: url,
            success: () => wx.showToast({ title: '链接已复制' })
          });
        }
      }
    });
  }
})
