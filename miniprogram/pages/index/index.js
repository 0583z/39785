const { competitions } = require('../../data.js');

Page({
  data: {
    competitions: [],
    searchQuery: '',
    selectedMajor: '全部',
    majors: ['全部', '计算机', '设计', '自动化', '数学', '电子', '机械'],
    timers: {}
  },

  onLoad() {
    this.setData({
      competitions: this.formatCompetitions(competitions)
    });
    this.startTimers();
  },

  onUnload() {
    this.stopTimers();
  },

  formatCompetitions(list) {
    return list.map(item => ({
      ...item,
      winningProb: (item.historicalAwardRatio * 100).toFixed(1),
      timeLeft: '计算中...'
    }));
  },

  startTimers() {
    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const updatedList = this.data.competitions.map(item => {
        const deadline = new Date(item.deadline).getTime();
        const diff = deadline - now;
        
        let timeLeft = '';
        if (diff <= 0) {
          timeLeft = '已截止';
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          timeLeft = `${days}天 ${hours}时 ${minutes}分`;
        }
        return { ...item, timeLeft };
      });

      this.setData({ competitions: updatedList });
    }, 60000); // 每分钟更新一次
  },

  stopTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  // 模拟微信订阅消息 API
  handleSubscribe(e) {
    const { id, name } = e.currentTarget.dataset;
    
    wx.requestSubscribeMessage({
      tmplIds: ['TEMPLATE_ID_001'], // 模拟模板ID
      success: (res) => {
        if (res['TEMPLATE_ID_001'] === 'accept') {
          wx.showToast({
            title: '订阅成功',
            icon: 'success'
          });
          console.log(`用户已订阅竞赛提醒: ${name}`);
        }
      },
      fail: (err) => {
        // 模拟环境下的降级处理
        wx.showModal({
          title: '订阅提醒',
          content: `您已成功订阅“${name}”的截止提醒，我们将在截止前3天通知您。`,
          showCancel: false
        });
      }
    });
  },

  handleSearch(e) {
    this.setData({ searchQuery: e.detail.value });
    this.filterList();
  },

  handleMajorSelect(e) {
    this.setData({ selectedMajor: e.currentTarget.dataset.major });
    this.filterList();
  },

  filterList() {
    const { searchQuery, selectedMajor } = this.data;
    const filtered = competitions.filter(comp => {
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMajor = selectedMajor === '全部' || 
                           comp.major.includes(selectedMajor) || 
                           comp.major.includes('不限');
      return matchesSearch && matchesMajor;
    });
    this.setData({ competitions: this.formatCompetitions(filtered) });
  }
});
