const mockCompetitions = [
  {
    id: '1',
    name: '2026 第十一届中国国际“互联网+”大学生创新创业大赛',
    level: '国家级',
    category: '创新创业',
    deadline: '2026-06-30',
    targetGoal: '保研'
  },
  {
    id: '2',
    name: '2026 第十七届蓝桥杯全国软件和信息技术专业人才大赛',
    level: '国家级',
    category: '程序设计',
    deadline: '2026-03-15',
    targetGoal: '就业'
  }
];

const mockUser = {
  name: '张伟',
  grade: '大三',
  major: '计算机',
  goal: '保研',
  followedCount: 8,
  registeredCount: 3,
  awardCount: 5
};

module.exports = {
  competitions: mockCompetitions,
  user: mockUser
}
