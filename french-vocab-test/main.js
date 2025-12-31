// 全局变量
const totalQuestions_Comprehensive = 20;
const totalQuestions_Specialized = 10;

let vocabData = [];
let currentQuiz = {
    type: '',
    subType: '',
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    answered: false,
    totalQuestions: totalQuestions_Comprehensive,
    usedConjugations: [],
    usedGenderForms: [],
    wrongAnswers: []
};

// 全局变量中添加分页和排序相关变量
let currentPage = 1;
const itemsPerPage = 10; // 每页显示10个词汇，方便修改
let filteredVocab = [];

// 初始化
$(document).ready(function() {
    // 加载词汇数据
    loadVocabData();
    
    // 导航栏事件
    $('#nav-home').click(function(e) {
        e.preventDefault();
        resetQuiz();
        showScreen('welcome-screen');
        setActiveNav('nav-home');
    });

    $('#nav-comprehensive').click(function(e) {
        e.preventDefault();
        resetQuiz();
        startComprehensiveQuiz();
        setActiveNav('nav-comprehensive');
    });

    $('#nav-specialized').click(function(e) {
        e.preventDefault();
        resetQuiz();
        showScreen('specialized-select');
        setActiveNav('nav-specialized');
    });

    $('#nav-vocab-book').click(function(e) {
        e.preventDefault();
        resetQuiz();
        showScreen('vocab-book-screen');
        setActiveNav('nav-vocab-book');
        renderVocabBook();
    });

    // 欢迎界面事件
    $('#comprehensive-btn').click(startComprehensiveQuiz);
    $('#specialized-btn').click(function() {
        showScreen('specialized-select');
        setActiveNav('nav-specialized');
    });
    $('#vocab-book-btn').click(function() {
        showScreen('vocab-book-screen');
        setActiveNav('nav-vocab-book');
        renderVocabBook();
    });

    // 专项训练选择事件
    $('.specialized-option').click(function() {
        currentQuiz.type = 'specialized';
        currentQuiz.subType = $(this).data('type');
        generateQuizQuestions();
        showScreen('quiz-screen');
        loadCurrentQuestion();
    });

    $('#back-to-welcome').click(function() {
        showScreen('welcome-screen');
        setActiveNav('nav-home');
    });

    // 答题事件
    $(document).on('click', '.option-btn', function() {
        if (currentQuiz.answered) return;
        
        const selectedOption = $(this);
        const correctAnswer = currentQuiz.questions[currentQuiz.currentQuestionIndex].correctAnswer;
        const selectedValue = selectedOption.data('value');
        
        // 记录错题
        if (selectedValue !== correctAnswer) {
            currentQuiz.wrongAnswers.push({
                question: currentQuiz.questions[currentQuiz.currentQuestionIndex].questionText,
                userAnswer: selectedValue,
                userAnswerText: selectedOption.text(),
                correctAnswer: correctAnswer,
                correctAnswerText: $(`.option-btn[data-value="${correctAnswer}"]`).text()
            });
        }
        
        // 标记答案
        if (selectedValue === correctAnswer) {
            selectedOption.addClass('correct');
            currentQuiz.score++;
            $('#feedback').html('<div class="alert alert-success feedback-alert">✅ 回答正确！</div>');
        } else {
            selectedOption.addClass('incorrect');
            $(`.option-btn[data-value="${correctAnswer}"]`).addClass('correct');
            $('#feedback').html(`<div class="alert alert-danger feedback-alert">❌ 回答错误！正确答案是：${$(`.option-btn[data-value="${correctAnswer}"]`).text()}</div>`);
        }
        
        currentQuiz.answered = true;
        $('#next-question').removeClass('hidden');
        
        if (currentQuiz.currentQuestionIndex === currentQuiz.totalQuestions - 1) {
            $('#next-question').html('<span>查看结果</span><i class="bi bi-bar-chart-fill"></i>');
        }
    });

    // 下一题事件
    $('#next-question').click(function() {
        currentQuiz.currentQuestionIndex++;
        
        if (currentQuiz.currentQuestionIndex < currentQuiz.totalQuestions) {
            loadCurrentQuestion();
            $('#feedback').empty();
            $(this).addClass('hidden');
        } else {
            showResults();
        }
    });

    // 结果界面事件
    $('#restart-quiz').click(function() {
        resetQuiz();
        generateQuizQuestions();
        showScreen('quiz-screen');
        loadCurrentQuestion();
        $('#next-question').html('<span>下一题</span><i class="bi bi-arrow-right"></i>').addClass('hidden');
        $('#feedback').empty();
    });

    $('#back-to-select').click(function() {
        resetQuiz();
        $('#next-question').html('<span>下一题</span><i class="bi bi-arrow-right"></i>').addClass('hidden');
        if (currentQuiz.type === 'comprehensive') {
            showScreen('welcome-screen');
            setActiveNav('nav-home');
        } else {
            showScreen('specialized-select');
            setActiveNav('nav-specialized');
        }
    });

    // 单词本筛选事件
    $('#filter-all, #filter-nouns, #filter-verbs, #filter-adjectives, #filter-preposition').click(function() {
        $('.vocab-book-filter .btn').removeClass('btn-primary').addClass('btn-light');
        $(this).removeClass('btn-light').addClass('btn-primary');
        
        const filterType = getFilterTypeByParties();
        
        currentPage = 1; // 筛选变化时重置到第一页
        renderVocabBook(filterType, $('#vocab-search').val());
    });

    // 单词本搜索事件
    $('#vocab-search').on('input', function() {
        const filterType = getFilterTypeByParties();
        
        currentPage = 1; // 搜索变化时重置到第一页
        renderVocabBook(filterType, $(this).val());
    });

    // 单词本排序事件
    $('#vocab-sort').change(function() {
        const filterType = getFilterTypeByParties();
        currentPage = 1; // 排序变化时重置到第一页
        renderVocabBook(filterType, $('#vocab-search').val());
    });
});

// 加载词汇数据
function loadVocabData() {
    // 优先加载外部JSON文件，失败则使用示例数据
    const vocabFile = 'vocab.json';
    
    $.getJSON(vocabFile)
        .done(function(data) {
            vocabData = data;
            console.log(`成功加载 ${vocabData.length} 个词汇`);
            $('#loading-screen').addClass('hidden');
            $('#welcome-screen').removeClass('hidden');
        })
        .fail(function() {
            alert('加载外部词汇数据失败，将使用内置示例数据');
            vocabData = getSampleVocabData();
            $('#loading-screen').addClass('hidden');
            $('#welcome-screen').removeClass('hidden');
        });
}

// 设置激活的导航项
function setActiveNav(navId) {
    $('.nav-link').removeClass('active');
    $(`#${navId}`).addClass('active');
}

// 开始综合练习
function startComprehensiveQuiz() {
    currentQuiz.type = 'comprehensive';
    resetQuiz();
    generateQuizQuestions();
    showScreen('quiz-screen');
    loadCurrentQuestion();
    setActiveNav('nav-comprehensive');
}

// 显示指定屏幕
function showScreen(screenId) {
    $('.app-content > div').addClass('hidden');
    $(`#${screenId}`).removeClass('hidden');
}

// 重置测试状态
function resetQuiz() {
    currentQuiz = {
        type: currentQuiz.type,
        subType: currentQuiz.subType,
        questions: [],
        currentQuestionIndex: 0,
        score: 0,
        answered: false,
        totalQuestions: currentQuiz.type === 'specialized' ? totalQuestions_Specialized : totalQuestions_Comprehensive,
        usedConjugations: [],
        usedGenderForms: [],
        wrongAnswers: []
    };
    $('#feedback').empty();
}

// 生成测试题目
function generateQuizQuestions() {
    currentQuiz.questions = [];
    currentQuiz.usedConjugations = [];
    currentQuiz.usedGenderForms = [];
    currentQuiz.wrongAnswers = [];
    
    if (currentQuiz.type === 'specialized') {
        currentQuiz.totalQuestions = totalQuestions_Specialized;
        
        switch(currentQuiz.subType) {
            case 'conjugation':
                generateVerbConjugationQuestions();
                return;
            case 'gender':
                generateGenderQuestions();
                return;
            case 'gender-form':
                generateGenderFormQuestions();
                return;
        }
    }
    
    // 综合练习或其他专项
    const shuffledVocab = shuffleArray([...vocabData]);
    const selectedVocab = shuffledVocab.slice(0, currentQuiz.totalQuestions);
    
    selectedVocab.forEach(vocab => {
        let question = {};
        
        if (currentQuiz.type === 'comprehensive') {
            const questionTypes = ['meaning', 'gender', 'gender-form', 'conjugation'];
            const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            question = generateQuestionByType(vocab, randomType);
        } else {
            question = generateQuestionByType(vocab, currentQuiz.subType);
        }
        
        currentQuiz.questions.push(question);
    });
}

// 生成词汇阴阳性题目
function generateGenderQuestions() {
    const validVocab = vocabData.filter(vocab => vocab.gender !== undefined);
    const shuffledVocab = shuffleArray([...validVocab]);
    
    if (shuffledVocab.length === 0) {
        alert('没有可用的阴阳性词汇，将切换到词汇意思测试');
        currentQuiz.subType = 'meaning';
        generateQuizQuestions();
        return;
    }
    
    currentQuiz.totalQuestions = Math.min(totalQuestions_Specialized, shuffledVocab.length);
    const selectedVocab = shuffledVocab.slice(0, currentQuiz.totalQuestions);
    
    selectedVocab.forEach(vocab => {
        const question = {
            vocab: vocab,
            type: 'gender',
            questionText: `请问 "${vocab.french}" 的词性（阴阳性）是？`,
            options: [
                { text: '阳性', value: '阳性' },
                { text: '阴性', value: '阴性' },
                { text: '无性别', value: '无性别' },
                { text: '阴阳同形', value: '阴阳同形' }
            ],
            correctAnswer: ''
        };
        
        // 确定正确答案
        if (vocab.type === '动词') {
            question.correctAnswer = '无性别';
        } else if (vocab.gender === '阴阳同形') {
            question.correctAnswer = '阴阳同形';
        } else {
            question.correctAnswer = vocab.gender || '无性别';
        }
        
        question.options = shuffleArray(question.options);
        currentQuiz.questions.push(question);
    });
}

// 生成对应阴/阳性形式题目
function generateGenderFormQuestions() {
    const validVocab = vocabData.filter(vocab => 
        (vocab.type === '名词' || vocab.type === '形容词') && 
        (vocab.masculineForm || vocab.feminineForm) &&
        vocab.gender !== undefined
    );
    
    const shuffledVocab = shuffleArray([...validVocab]);
    if (shuffledVocab.length === 0) {
        alert('没有可用的名词/形容词词汇，将切换到词汇意思测试');
        currentQuiz.subType = 'meaning';
        generateQuizQuestions();
        return;
    }
    
    let questionsGenerated = 0;
    const totalNeeded = totalQuestions_Specialized;
    const vocabCopy = [...shuffledVocab];
    
    // 生成题目
    while (questionsGenerated < totalNeeded && vocabCopy.length > 0) {
        const vocab = vocabCopy[Math.floor(Math.random() * vocabCopy.length)];
        const question = generateSingleGenderFormQuestion(vocab);
        
        if (question) {
            currentQuiz.questions.push(question);
            questionsGenerated++;
            vocabCopy.splice(vocabCopy.indexOf(vocab), 1);
        }
    }
    
    currentQuiz.totalQuestions = questionsGenerated;
}

// 生成单个阴/阳性形式题目
function generateSingleGenderFormQuestion(vocab) {
    const question = {
        vocab: vocab,
        type: 'gender-form',
        questionText: '',
        options: [],
        correctAnswer: ''
    };
    
    // 阴阳同形词汇处理
    if (vocab.gender === '阴阳同形') {
        question.questionText = `请问 "${vocab.french}" 对应的阴/阳性形式是什么？`;
        question.correctAnswer = vocab.french;
        
        // 生成干扰项（包含"无"选项）
        const distractors = [{ text: vocab.french, value: vocab.french }];
        const candidates = [];
        
        vocabData.forEach(v => {
            if (v.french !== vocab.french && (v.type === '名词' || v.type === '形容词')) {
                candidates.push(v.french);
            }
        });
        
        const shuffled = shuffleArray(candidates);
        for (let i = 0; i < 3 && i < shuffled.length; i++) {
            distractors.push({ text: shuffled[i], value: shuffled[i] });
        }
        
        question.options = distractors;
    } 
    // 普通词汇处理
    else if (vocab.gender === '阳性' && vocab.feminineForm) {
        question.questionText = `请问 "${vocab.french}" 的阴性形式是？`;
        question.correctAnswer = vocab.feminineForm;
        question.options = generateDistractors(vocab.feminineForm, 'french');
    } else if (vocab.gender === '阴性' && vocab.masculineForm) {
        question.questionText = `请问 "${vocab.french}" 的阳性形式是？`;
        question.correctAnswer = vocab.masculineForm;
        question.options = generateDistractors(vocab.masculineForm, 'french');
    } else {
        question.questionText = `请问 "${vocab.french}" 对应的阴/阳性形式是什么？`;
        question.correctAnswer = '无';
        question.options = generateDistractors('无', 'french');
    }
    
    // 确保包含"无"选项
    const hasNoneOption = question.options.some(opt => opt.value === '无');
    if (!hasNoneOption) {
        if (question.options.length >= 4) {
            question.options[3] = { text: '无', value: '无' };
        } else {
            question.options.push({ text: '无', value: '无' });
        }
    }
    
    question.options = shuffleArray(question.options);
    return question;
}

// 生成动词变位题目
function generateVerbConjugationQuestions() {
    const verbVocab = vocabData.filter(vocab => vocab.type === '动词' && vocab.conjugation);
    const shuffledVerbVocab = shuffleArray([...verbVocab]);
    
    if (shuffledVerbVocab.length === 0) {
        alert('没有可用的动词词汇，将切换到词汇意思测试');
        currentQuiz.subType = 'meaning';
        generateQuizQuestions();
        return;
    }
    
    let questionsGenerated = 0;
    const totalNeeded = totalQuestions_Specialized;
    
    while (questionsGenerated < totalNeeded && shuffledVerbVocab.length > 0) {
        const verb = shuffledVerbVocab[questionsGenerated % shuffledVerbVocab.length];
        const question = generateUniqueConjugationQuestion(verb);
        
        if (question) {
            currentQuiz.questions.push(question);
            questionsGenerated++;
        } else {
            shuffledVerbVocab.splice(questionsGenerated % shuffledVerbVocab.length, 1);
        }
    }
    
    currentQuiz.totalQuestions = questionsGenerated;
}

// 生成唯一的动词变位题目
function generateUniqueConjugationQuestion(verb) {
    if (!verb.conjugation) return null;
    
    const conjugations = Object.entries(verb.conjugation);
    const availableConjugations = conjugations.filter(([person, form]) => {
        const key = `${verb.french}_${person}`;
        return !currentQuiz.usedConjugations.includes(key);
    });
    
    if (availableConjugations.length === 0) return null;
    
    const randomConj = availableConjugations[Math.floor(Math.random() * availableConjugations.length)];
    const person = randomConj[0];
    const conjugationForm = randomConj[1];
    
    currentQuiz.usedConjugations.push(`${verb.french}_${person}`);
    
    const question = {
        vocab: verb,
        type: 'conjugation',
        questionText: `请问 "${verb.french}" 的 ${person} 变位形式是？`,
        options: generateConjugationDistractors(verb, conjugationForm),
        correctAnswer: conjugationForm
    };
    
    question.options = shuffleArray(question.options);
    return question;
}

// 生成动词变位干扰项
function generateConjugationDistractors(verb, correctForm) {
    const distractors = [{ text: correctForm, value: correctForm }];
    const otherConjugations = [];
    
    // 从当前动词的其他变位中选择
    Object.values(verb.conjugation).forEach(form => {
        if (form !== correctForm) otherConjugations.push(form);
    });
    
    // 补充其他动词的变位
    if (otherConjugations.length < 3) {
        vocabData.forEach(v => {
            if (v.type === '动词' && v.conjugation && v.french !== verb.french) {
                Object.values(v.conjugation).forEach(form => {
                    if (form !== correctForm && !otherConjugations.includes(form)) {
                        otherConjugations.push(form);
                    }
                });
            }
        });
    }
    
    // 随机选择3个干扰项
    const shuffled = shuffleArray(otherConjugations);
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
        distractors.push({ text: shuffled[i], value: shuffled[i] });
    }
    
    return distractors;
}

// 根据类型生成题目
function generateQuestionByType(vocab, type) {
    const question = {
        vocab: vocab,
        type: type,
        questionText: '',
        options: [],
        correctAnswer: ''
    };

    switch(type) {
        case 'meaning':
            // 中法互译
            if (Math.random() > 0.5) {
                question.questionText = `请问 "${vocab.french}" 的中文意思是？`;
                question.correctAnswer = vocab.meaning;
                question.options = generateDistractors(vocab.meaning, 'meaning');
            } else {
                question.questionText = `请问 "${vocab.meaning}" 的法语表达是？`;
                question.correctAnswer = vocab.french;
                question.options = generateDistractors(vocab.french, 'french');
            }
            break;
        
        case 'gender':
            question.questionText = `请问 "${vocab.french}" 的词性（阴阳性）是？`;
            question.options = [
                { text: '阳性', value: '阳性' },
                { text: '阴性', value: '阴性' },
                { text: '无性别', value: '无性别' },
                { text: '阴阳同形', value: '阴阳同形' }
            ];
            
            if (vocab.type === '动词') {
                question.correctAnswer = '无性别';
            } else if (vocab.gender === '阴阳同形') {
                question.correctAnswer = '阴阳同形';
            } else {
                question.correctAnswer = vocab.gender || '无性别';
            }
            break;
        
        case 'gender-form':
            return generateSingleGenderFormQuestion(vocab);
            
        case 'conjugation':
            if (vocab.type === '动词' && vocab.conjugation) {
                return generateUniqueConjugationQuestion(vocab);
            } else {
                return generateQuestionByType(vocab, 'meaning');
            }
    }

    question.options = shuffleArray(question.options);
    return question;
}

// 生成通用干扰项
function generateDistractors(correctValue, type) {
    const distractors = [{ text: correctValue, value: correctValue }];
    const candidates = [];
    
    vocabData.forEach(vocab => {
        if (type === 'meaning' && vocab.meaning !== correctValue) {
            candidates.push(vocab.meaning);
        } else if (type === 'french' && vocab.french !== correctValue) {
            candidates.push(vocab.french);
        }
    });

    const shuffled = shuffleArray(candidates);
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
        distractors.push({ text: shuffled[i], value: shuffled[i] });
    }

    while (distractors.length < 4) {
        distractors.push({ 
            text: `干扰项${distractors.length}`, 
            value: `干扰项${distractors.length}` 
        });
    }

    return distractors;
}

// 加载当前题目
function loadCurrentQuestion() {
    const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
    
    $('#question-count').text(`${currentQuiz.currentQuestionIndex + 1}/${currentQuiz.totalQuestions}`);
    $('#question-text').text(question.questionText);
    
    $('#options-container').empty();
    question.options.forEach(option => {
        const btn = $(`<button class="btn btn-light option-btn" data-value="${option.value}">${option.text}</button>`);
        $('#options-container').append(btn);
    });
    
    currentQuiz.answered = false;
    $('#next-question').addClass('hidden');
}

// 显示测试结果
function showResults() {
    const score = currentQuiz.score;
    const total = currentQuiz.totalQuestions;
    const accuracy = total > 0 ? ((score / total) * 100).toFixed(1) : 0;
    
    $('#total-questions-hint').text(`共完成 ${total} 道题目`);
    $('#score').text(`${score}/${total}`);
    $('#accuracy').text(accuracy);
    
    // 渲染错题
    renderWrongAnswers();
    
    showScreen('result-screen');
}

// 渲染错题展示
function renderWrongAnswers() {
    const wrongAnswersList = $('#wrong-answers-list');
    wrongAnswersList.empty();
    
    if (currentQuiz.wrongAnswers.length > 0) {
        $('#wrong-answers-container').removeClass('hidden');
        
        currentQuiz.wrongAnswers.forEach((wrongAnswer, index) => {
            const wrongAnswerItem = $(`
                <div class="wrong-answer-item">
                    <div class="wrong-answer-question">${index + 1}. ${wrongAnswer.question}</div>
                    <div class="wrong-answer-details">
                        <div class="wrong-answer-your-choice">
                            <span class="fw-bold">你的答案：</span>
                            ${wrongAnswer.userAnswerText}
                        </div>
                        <div class="wrong-answer-correct">
                            <span class="fw-bold">正确答案：</span>
                            ${wrongAnswer.correctAnswerText}
                        </div>
                    </div>
                </div>
            `);
            wrongAnswersList.append(wrongAnswerItem);
        });
    } else {
        $('#wrong-answers-container').addClass('hidden');
    }
}

// 渲染单词本，支持排序、分页和扩展搜索
function renderVocabBook(filterType = 'all', searchTerm = '') {
    // 获取当前排序方式
    const sortType = $('#vocab-sort').val();
    
    // 1. 筛选词汇
    filteredVocab = vocabData.filter(vocab => {
        // 类型筛选
        if (filterType !== 'all') {
            if (vocab.type !== filterType) return false;
        }
        
        // 搜索词筛选（扩展到变位和阴阳性）
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            const matchesFrench = vocab.french?.toLowerCase().includes(term);
            const matchesChinese = vocab.chinese?.toLowerCase().includes(term);
            const matchesConjugation = vocab.conjugation 
                ? Object.values(vocab.conjugation).some(form => form.toLowerCase().includes(term))
                : false;
            const matchesGenderForm = vocab.genderForm 
                ? vocab.genderForm.toLowerCase().includes(term)
                : false;
                
            if (!(matchesFrench || matchesChinese || matchesConjugation || matchesGenderForm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // 2. 排序词汇
    filteredVocab.sort((a, b) => {
        switch(sortType) {
            case 'alphabetical':
                return a.french.localeCompare(b.french);
            case 'part-of-speech':
                return a.type.localeCompare(b.type);
            case 'gender':
                // 没有阴阳性的放后面
                if (!a.gender) return 1;
                if (!b.gender) return -1;
                return a.gender.localeCompare(b.gender);
            default:
                return 0;
        }
    });
    
    // 3. 分页处理
    const totalPages = Math.ceil(filteredVocab.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVocab = filteredVocab.slice(startIndex, startIndex + itemsPerPage);
    
    // 4. 渲染词汇列表
    const vocabListContainer = $('#vocab-list-container');
    vocabListContainer.empty();
    
    if (paginatedVocab.length === 0) {
        $('#no-vocab-found').removeClass('hidden');
    } else {
        $('#no-vocab-found').addClass('hidden');
        
        paginatedVocab.forEach(vocab => {
            const vocabCard = createVocabCard(vocab);
            vocabListContainer.append(vocabCard);
        });
    }
    
    // 5. 渲染分页控件
    renderPagination(totalPages);
}

// 创建词汇卡片（提取为独立函数，保持代码清晰）
function createVocabCard(vocab) {
    let cardHtml = `
        <div class="vocab-card">
                <div class="vocab-card-header">
                    <div class="vocab-french">${vocab.french}</div>
                    <div class="vocab-type">${vocab.type}</div>
                </div>
                <div class="vocab-meaning"><strong>中文释义：</strong>${vocab.meaning}</div>
                <div class="vocab-details">
                    <div class="vocab-detail-item">
                        <div class="vocab-detail-label">阴阳性</div>
                        <div class="vocab-detail-value">${vocab.gender || '无'}</div>
                    </div>
    `;
    
    // 添加阴阳性信息（如果有）
    if (vocab.feminineForm) {
        cardHtml += `
            <div class="vocab-detail-item">
                <div class="vocab-detail-label">阴性形式</div>
                <div class="vocab-detail-value">${vocab.feminineForm}</div>
            </div>
        `;
    }
    
    // 添加对应阴阳形式（如果有）
    if (vocab.masculineForm) {
        cardHtml += `
            <div class="vocab-detail-item">
                <div class="vocab-detail-label">阳性形式</div>
                <div class="vocab-detail-value">${vocab.masculineForm}</div>
            </div>
        `;
    }
    
    cardHtml += `</div>`;
    
    // 添加动词变位（如果有）
    if (vocab.conjugation) {
        cardHtml += `
            <div class="vocab-conjugation">
                <div class="vocab-detail-label">动词变位</div>
                <div class="conjugation-grid">
        `;
        
        Object.entries(vocab.conjugation).forEach(([person, form]) => {
            cardHtml += `
                <div class="conjugation-item">
                    <div class="conjugation-person">${person}</div>
                    <div class="conjugation-form">${form}</div>
                </div>
            `;
        });
        
        cardHtml += `
                </div>
            </div>
        `;
    }
    
    cardHtml += `</div>`;
    return cardHtml;
}

// 渲染分页控件
function renderPagination(totalPages) {
    const paginationContainer = $('#pagination');
    paginationContainer.empty();

    const filterType = getFilterTypeByParties();
    
    // 只在有多个页面时显示分页控件
    if (totalPages <= 1) {
        $('#pagination-container').addClass('hidden');
        return;
    }
    
    $('#pagination-container').removeClass('hidden');
    
    // 添加上一页按钮
    const prevLi = $('<li>').addClass('page-item').toggleClass('disabled', currentPage === 1);
    const prevLink = $('<a>').addClass('page-link').attr('href', '#').text('上一页');
    prevLink.click(function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderVocabBook(filterType, $('#vocab-search').val());
        }
    });
    prevLi.append(prevLink);
    paginationContainer.append(prevLi);
    
    // 添加页码按钮（最多显示5个页码）
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = $('<li>').addClass('page-item').toggleClass('active', i === currentPage);
        const pageLink = $('<a>').addClass('page-link').attr('href', '#').text(i);
        pageLink.click(function(e) {
            e.preventDefault();
            currentPage = i;
            renderVocabBook(filterType, $('#vocab-search').val());
        });
        pageLi.append(pageLink);
        paginationContainer.append(pageLi);
    }
    
    // 添加下一页按钮
    const nextLi = $('<li>').addClass('page-item').toggleClass('disabled', currentPage === totalPages);
    const nextLink = $('<a>').addClass('page-link').attr('href', '#').text('下一页');
    nextLink.click(function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderVocabBook(filterType, $('#vocab-search').val());
        }
    });
    nextLi.append(nextLink);
    paginationContainer.append(nextLi);
}

// 获取当前词类筛选类型
function getFilterTypeByParties() {
    let filterType = 'all';
    if ($('#filter-nouns').hasClass('btn-primary')) filterType = '名词';
    else if ($('#filter-verbs').hasClass('btn-primary')) filterType = '动词';
    else if ($('#filter-adjectives').hasClass('btn-primary')) filterType = '形容词';
    else if ($('#filter-preposition').hasClass('btn-primary')) filterType = '介词';
    return filterType;
}

// 打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 示例词汇数据
function getSampleVocabData() {
    return [
        {
            french: 'ami',
            meaning: '朋友（阳性）',
            type: '名词',
            gender: '阳性',
            feminineForm: 'amie',
            masculineForm: ''
        },
        {
            french: 'parler',
            meaning: '说，讲',
            type: '动词',
            gender: '无性别',
            conjugation: {
                'je': 'parle',
                'tu': 'parles',
                'il/elle': 'parle',
                'nous': 'parlons',
                'vous': 'parlez',
                'ils/elles': 'parlent'
            }
        },
        {
            french: 'fleur',
            meaning: '花',
            type: '名词',
            gender: '阴性',
            masculineForm: '',
            feminineForm: ''
        },
        {
            french: 'professeur',
            meaning: '老师',
            type: '名词',
            gender: '阴阳同形',
            feminineForm: '',
            masculineForm: ''
        },
        {
            french: 'beau',
            meaning: '美丽的（阳性）',
            type: '形容词',
            gender: '阳性',
            feminineForm: 'belle',
            masculineForm: ''
        },
        {
            french: 'triste',
            meaning: '悲伤的',
            type: '形容词',
            gender: '阴阳同形',
            masculineForm: '',
            feminineForm: ''
        }
    ];
}

// (占位) 特殊词汇：仅存在单一性别形式，但通用于阴阳两性的词汇列表
function getOneGenderFormOnlyWord() {
    return [
        "chercheur",
        "pilote",
        "professeur",
        "médicin",
        "ingénieur"
    ];
}