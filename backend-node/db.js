const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'library.db')

let _db = null
let _lastInsertId = 0

// Prepare & step a statement, returning rows as objects
function _query(sql, params = []) {
  const stmt = _db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

// Execute a write statement
function _execute(sql, params = []) {
  const stmt = _db.prepare(sql)
  stmt.bind(params)
  stmt.step()
  _lastInsertId = _db.exec("SELECT last_insert_rowid()")[0].values[0][0]
  stmt.free()
}

function _save() {
  fs.writeFileSync(DB_PATH, Buffer.from(_db.export()))
}

async function initDB() {
  const SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    _db = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    _db = new SQL.Database()
  }

  _db.run(`PRAGMA foreign_keys = ON`)

  _db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      email TEXT DEFAULT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      status INTEGER NOT NULL DEFAULT 1,
      create_time DATETIME DEFAULT (datetime('now','localtime'))
    )
  `)
  _db.run(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT DEFAULT NULL,
      publisher TEXT DEFAULT NULL,
      category TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      cover_url TEXT DEFAULT NULL,
      total INTEGER NOT NULL DEFAULT 1,
      available INTEGER NOT NULL DEFAULT 1,
      create_time DATETIME DEFAULT (datetime('now','localtime')),
      update_time DATETIME DEFAULT (datetime('now','localtime'))
    )
  `)
  _db.run(`
    CREATE TABLE IF NOT EXISTS borrow_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrow_time DATETIME NOT NULL,
      due_time DATETIME NOT NULL,
      return_time DATETIME DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'BORROWED',
      fine_amount REAL DEFAULT 0.0,
      create_time DATETIME DEFAULT (datetime('now','localtime'))
    )
  `)
  _save()

  // Seed data
  const count = _query('SELECT COUNT(*) as cnt FROM user')[0].cnt
  if (count === 0) {
    const md5 = require('md5')
    _execute('INSERT INTO user (username,password,real_name,phone,email,role,status) VALUES (?,?,?,?,?,?,?)',
      ['admin', md5('admin123'), '系统管理员', null, null, 'ADMIN', 1])
    _execute('INSERT INTO user (username,password,real_name,phone,email,role,status) VALUES (?,?,?,?,?,?,?)',
      ['test', md5('test123'), '测试用户', '13800138000', 'test@example.com', 'USER', 1])

    const books = [
      // ===== 编程类 =====
      ['Java编程思想（第4版）', 'Bruce Eckel', '9787111213826', '机械工业出版社', '编程', '本书赢得了全球程序员的广泛赞誉，即使是最晦涩的概念，在Bruce Eckel的文字亲和力和小而直接的编程示例面前也会化解于无形。从Java的基础语法到最高级特性，本书都能逐步指导你轻松掌握。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s27243411.jpg'],
      ['深入理解Java虚拟机（第3版）', '周志明', '9787111641247', '机械工业出版社', '编程', '全书围绕内存管理、执行子系统、程序编译与优化、高效并发等核心主题对JVM进行了全面而深入的分析，深刻揭示了JVM的工作原理。是Java开发者从初级迈向高级的必读之作，被誉为国内最好的JVM书籍。', 3, 3, 'https://img2.doubanio.com/view/subject/l/public/s33803503.jpg'],
      ['Spring实战（第6版）', 'Craig Walls', '9787115577803', '人民邮电出版社', '编程', '本书是一本经典而实用的Spring学习指南，全面介绍了Spring Framework和Spring Boot的各项功能。从核心容器、Web开发到数据持久化、安全性，循序渐进地带领读者掌握Spring生态系统的精髓。', 4, 4, 'https://img2.doubanio.com/view/subject/l/public/s34354447.jpg'],
      ['JavaScript高级程序设计（第4版）', 'Matt Frisbie', '9787115545381', '人民邮电出版社', '编程', '本书是JavaScript超级畅销书的最新版，涵盖了ECMAScript 2019。全面深入地介绍了JavaScript开发者必须掌握的前端开发技术，被前端开发者誉为"红宝书"。', 4, 4, 'https://img2.doubanio.com/view/subject/l/public/s33892003.jpg'],
      ['算法导论（第3版）', 'Thomas H.Cormen', '9787111407010', '机械工业出版社', '编程', '本书全面介绍了算法的基础知识，包括排序、图算法、字符串匹配等经典算法设计，以及线性规划、计算几何、NP完全性等高级主题。被誉为计算机科学领域的圣经级教材，全球超过百万读者。', 3, 3, 'https://img2.doubanio.com/view/subject/l/public/s25648004.jpg'],
      ['Python编程：从入门到实践（第3版）', 'Eric Matthes', '9787115546081', '人民邮电出版社', '编程', '本书是一本针对所有层次Python读者而作的Python入门书。第一部分介绍用Python编程所必须了解的基本概念；第二部分讲解如何开发三个实战项目。全球销量超过200万册。', 6, 6, 'https://img2.doubanio.com/view/subject/l/public/s34815433.jpg'],
      // ===== 科幻类 =====
      ['三体', '刘慈欣', '9787536692930', '重庆出版社', '科幻', '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。四光年外，三体文明正被迫逃离母星，而恰在此时他们接收到了地球发来的信息。庞大的三体舰队开始向地球进发，人类的末日悄然来临。雨果奖获奖作品。', 10, 10, 'https://img2.doubanio.com/view/subject/l/public/s2768378.jpg'],
      ['三体II：黑暗森林', '刘慈欣', '9787536693968', '重庆出版社', '科幻', '三体人在锁死了地球人的科学之后，庞大的宇宙舰队开始向地球进发。面壁计划由此展开——四位面壁者将各自制定对抗三体人的战略。然而在这场看似毫无希望的战争中，罗辑发现了宇宙文明间一条无比黑暗的法则。', 8, 8, 'https://img2.doubanio.com/view/subject/l/public/s3078482.jpg'],
      ['三体III：死神永生', '刘慈欣', '9787536699335', '重庆出版社', '科幻', '与三体文明的战争使人类第一次看到了宇宙黑暗的真相。降维打击、二向箔、黑域……当程心接过执剑人的按钮，整个太阳系的命运就此改变。雨果奖获奖作品"三体"系列的史诗终章。', 8, 8, 'https://img2.doubanio.com/view/subject/l/public/s8958650.jpg'],
      ['银河帝国：基地', '艾萨克·阿西莫夫', '9787539942131', '江苏文艺出版社', '科幻', '在银河帝国建立后的12020年，哈里·谢顿开创了"心理史学"，能用数学公式准确推演全人类的未来。谢顿预言银河帝国即将灭亡，他设立了两座基地。这部科幻史上最伟大的经典系列，影响了后世几乎所有科幻作品。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s6983698.jpg'],
      ['流浪地球', '刘慈欣', '9787535494740', '长江文艺出版社', '科幻', '科学家们发现太阳将膨胀为一颗红巨星，期间地球表面上的一切将毁灭殆尽。于是他们计划建造能将地球发射到其他星球的巨大引擎，以保证人类长远生存。同名电影票房超46亿。', 7, 7, 'https://img2.doubanio.com/view/subject/l/public/s29598553.jpg'],
      // ===== 文学类 =====
      ['活着', '余华', '9787530215319', '北京十月文艺出版社', '文学', '地主少爷福贵嗜赌成性，终于赌光了家业一贫如洗。穷困之中母亲生病前去求医，半路上被国民党抓了壮丁，后被解放军所俘虏。回到家乡才知母亲已过世，更加悲惨的命运一次又一次降临——妻子、儿女和孙子相继死去，最后只剩他和一头老牛相依为命。', 8, 8, 'https://img2.doubanio.com/view/subject/l/public/s29053580.jpg'],
      ['百年孤独', '加西亚·马尔克斯', '9787544253994', '南海出版公司', '文学', '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。作品融入神话传说、民间故事、宗教典故等神秘因素，巧妙地糅合了现实与虚幻。', 6, 6, 'https://img2.doubanio.com/view/subject/l/public/s6384944.jpg'],
      ['围城', '钱锺书', '9787020024759', '人民文学出版社', '文学', '主人公方鸿渐留学回国后，在爱情、事业、婚姻等方面遭遇了一系列的波折与困境。钱锺书以犀利幽默的语言、深刻的洞察力，描绘了民国时期知识分子的众生相。"围在城里的人想逃出来，城外的人想冲进去"成为不朽名言。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s1070222.jpg'],
      ['平凡的世界（全三册）', '路遥', '9787530212004', '北京十月文艺出版社', '文学', '以中国70年代中期到80年代中期十年间为背景，以孙少安和孙少平两兄弟为中心，刻画了当时社会各阶层众多普通人的形象。劳动与爱情、挫折与追求、痛苦与欢乐纷繁地交织在一起。茅盾文学奖获奖作品。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s28999003.jpg'],
      ['红楼梦', '曹雪芹', '9787020002207', '人民文学出版社', '文学', '中国古典四大名著之首，以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线，描绘了贾、史、王、薛四大家族的兴衰，展示了18世纪中国封建社会的方方面面。中国文学的巅峰之作，被誉为"中国封建社会的百科全书"。', 4, 4, 'https://img2.doubanio.com/view/subject/l/public/s1070959.jpg'],
      // ===== 历史类 =====
      ['万历十五年', '黄仁宇', '9787108009821', '生活·读书·新知三联书店', '历史', '万历十五年，即公元1587年，这一年中发生了若干为历史学家所易于忽视的事件。这些事件表面看来虽似末端小节，但实质上却是以前发生大事的症结，也是将在以后掀起波澜的机缘。大历史观的经典之作。', 6, 6, 'https://img2.doubanio.com/view/subject/l/public/s1632555.jpg'],
      ['人类简史：从动物到上帝', '尤瓦尔·赫拉利', '9787508647357', '中信出版社', '历史', '十万年前，地球上至少有六种不同的人。但今日，世界舞台为什么只剩下了我们自己？从认知革命、农业革命到科学革命，本书以大历史的视角审视人类的发展历程，视角宏大，观点新颖，全球畅销超过千万册。', 7, 7, 'https://img2.doubanio.com/view/subject/l/public/s27814883.jpg'],
      ['全球通史：从史前到21世纪', '斯塔夫里阿诺斯', '9787301109489', '北京大学出版社', '历史', '作者以全球视野审视世界历史，关注各文明之间的交流与碰撞，打破了以欧洲为中心的传统史观，为读者呈现了一幅宏大的世界历史画卷。被译成多种语言流传于世。', 4, 4, 'https://img2.doubanio.com/view/subject/l/public/s11170071.jpg'],
      ['明朝那些事儿', '当年明月', '9787213049927', '浙江人民出版社', '历史', '以一种前所未有的通俗幽默的语言，讲述了从1344年到1644年这三百年间关于明朝的故事。全景式地展示了明朝十七帝、王公权贵和小人物的命运，创造了21世纪初期中国出版界的销售神话。', 8, 8, 'https://img2.doubanio.com/view/subject/l/public/s2798686.jpg'],
      // ===== 心理类 =====
      ['社会性动物', '艾略特·阿伦森', '9787508640754', '中信出版社', '心理学', '社会心理学领域的经典教材，被誉为"美国社会心理学的圣经"。通过大量生动的实验和实例，深入浅出地介绍了从众、说服、偏见、攻击性、吸引力等社会心理学基本概念和理论。', 3, 3, 'https://img2.doubanio.com/view/subject/l/public/s27912231.jpg'],
      ['思考，快与慢', '丹尼尔·卡尼曼', '9787508633558', '中信出版社', '心理学', '诺贝尔经济学奖得主丹尼尔·卡尼曼毕生研究精华之作。阐述了人类认知中的两个系统——快系统和慢系统，以及它们如何塑造我们的判断与决策。这些洞见将彻底改变你对思考的看法。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s6510399.jpg'],
      // ===== 经济类 =====
      ['国富论', '亚当·斯密', '9787100017800', '商务印书馆', '经济学', '亚当·斯密第一次系统阐述了政治经济学的基本理论，提出了"看不见的手"这一著名论断，奠定了现代经济学的基础。书中对分工、货币、价值、分配等问题的分析至今仍具有深远影响。', 3, 3, 'https://img2.doubanio.com/view/subject/l/public/s1712270.jpg'],
      ['经济学原理（微观+宏观）', 'N·格里高利·曼昆', '9787301150894', '北京大学出版社', '经济学', '世界上最为经典和畅销的经济学入门教材，被全球数百万学生使用。曼昆以通俗易懂的语言、大量贴近生活的案例，带领读者理解十大经济学原理如何解释我们日常生活中的各种现象。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s8979493.jpg'],
      // ===== 哲学类 =====
      ['苏菲的世界', '乔斯坦·贾德', '9787506354257', '作家出版社', '哲学', '14岁的少女苏菲某天放学回家，发现了一封神秘的信——你是谁？世界从哪里来？在一位神秘导师的指引下，苏菲开始思索从古希腊到康德、从祁克果到弗洛伊德等各位大师所思考的根本问题。最优秀的哲学启蒙书。', 5, 5, 'https://img2.doubanio.com/view/subject/l/public/s1106927.jpg'],
      ['理想国', '柏拉图', '9787100017589', '商务印书馆', '哲学', '柏拉图最著名的代表作，西方政治思想传统最具代表性的作品。通过苏格拉底与他人的对话，给后人展现了一个完美优越的乌托邦。探讨了正义、教育、灵魂、艺术等诸多主题，是西方哲学史上最重要的著作之一。', 3, 3, 'https://img2.doubanio.com/view/subject/l/public/s1211277.jpg'],
    ]
    for (const b of books) {
      _execute('INSERT INTO book (title,author,isbn,publisher,category,description,total,available,cover_url) VALUES (?,?,?,?,?,?,?,?,?)', b)
    }
    _save()
  }

  return { _db, _query, _execute }
}

module.exports = {
  initDB,
  query(sql, params) { return _query(sql, params) },
  queryOne(sql, params) { const rows = _query(sql, params); return rows.length > 0 ? rows[0] : null },
  execute(sql, params) { _execute(sql, params); _save(); return { lastInsertRowid: _lastInsertId } },
  save() { _save() },
  get lastInsertId() { return _lastInsertId }
}
