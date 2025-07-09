document.addEventListener('DOMContentLoaded', function() {
    // Состояние приложения
    const state = {
        questions: [
            {
                type: "qa",
                number: "1",
                text: "",
                answers: [""],
                rightColumn: []
            }
        ],
        currentQuestionIndex: 0,
        styles: {
            backgroundColor: "#f5f5f5",
            fontFamily: "'Roboto', sans-serif",
            questionTextColor: "#000000",
            questionBgColor: "#ffffff",
            questionBorderColor: "#000000",
            questionFontSize: 16,
            answerTextColor: "#000000",
            answerBgColor: "#f0f0f0",
            answerBorderColor: "#cccccc",
            answerFontSize: 14,
            borderRadius: 5,
            questionPadding: 10,
            answerPadding: 8,
            questionMargin: 15,
            answerMargin: 5,
            answerIndent: 20,
            exportWidth: 800,
            exportHeight: 600,
            exportScale: 1,
            exportBgColor: "#ffffff",
            aspectRatioLocked: false,
            aspectRatio: 800/600
        },
        colorLinks: {
            questionBgColor: "questionBorderColor",
            answerBgColor: "answerBorderColor"
        }
    };

    // Элементы DOM
    const elements = {
        editPanel: document.getElementById('editPanel'),
        previewPanel: document.getElementById('previewPanel'),
        previewBackground: document.getElementById('previewBackground'),
        previewContent: document.getElementById('previewContent'),
        questionNumber: document.getElementById('questionNumber'),
        questionText: document.getElementById('questionText'),
        answersText: document.getElementById('answersText'),
        rightColumnText: document.getElementById('rightColumnText'),
        prevQuestion: document.getElementById('prevQuestion'),
        nextQuestion: document.getElementById('nextQuestion'),
        changeType: document.getElementById('changeType'),
        deleteQuestion: document.getElementById('deleteQuestion'),
        questionCounter: document.getElementById('questionCounter'),
        verticalSplitter: document.getElementById('verticalSplitter'),
        horizontalSplitter: document.getElementById('horizontalSplitter'),
        settingsPanel: document.getElementById('settingsPanel'),
        exportPreview: document.getElementById('exportPreview'),
        exportBtn: document.getElementById('exportBtn'),
        loadFont: document.getElementById('loadFont'),
        customFontUrl: document.getElementById('customFontUrl'),
        lockAspectRatio: document.getElementById('lockAspectRatio'),
        questionTypeModal: document.getElementById('questionTypeModal'),
        questionTextLabel: document.getElementById('questionTextLabel'),
        answersTextLabel: document.getElementById('answersTextLabel')
    };

    // Инициализация приложения
    function init() {
        setupEventListeners();
        updateQuestionForm();
        updatePreview();
        updateExportPreview();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Навигация по вопросам
        elements.prevQuestion.addEventListener('click', () => navigateQuestions(-1));
        elements.nextQuestion.addEventListener('click', function() {
            if (state.currentQuestionIndex === state.questions.length - 1) {
                showQuestionTypeModal(true);
            } else {
                navigateQuestions(1);
            }
        });
        elements.changeType.addEventListener('click', () => showQuestionTypeModal(false));
        elements.deleteQuestion.addEventListener('click', deleteCurrentQuestion);

        // Изменение данных вопроса
        elements.questionNumber.addEventListener('input', handleQuestionNumberChange);
        elements.questionText.addEventListener('input', handleQuestionTextChange);
        elements.answersText.addEventListener('input', handleAnswersTextChange);
        elements.rightColumnText.addEventListener('input', handleRightColumnChange);

        // Перетаскивание разделителей
        setupSplittersDrag();

        // Настройки
        setupSettingsListeners();

        // Экспорт
        elements.exportBtn.addEventListener('click', exportToPNG);
        elements.loadFont.addEventListener('click', loadCustomFont);

        // Модальное окно выбора типа вопроса
        document.querySelectorAll('.question-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const modal = document.getElementById('questionTypeModal');
                
                if (modal.dataset.currentText !== undefined) {
                    // Смена типа существующего вопроса
                    state.questions[state.currentQuestionIndex] = {
                        type: type,
                        number: state.questions[state.currentQuestionIndex].number,
                        text: modal.dataset.currentText,
                        answers: modal.dataset.currentAnswers.split('\n'),
                        rightColumn: type === 'match' ? modal.dataset.currentRightColumn.split('\n') : []
                    };
                } else {
                    // Добавление нового вопроса
                    addNewQuestion(type);
                }
                
                modal.style.display = 'none';
                delete modal.dataset.currentText;
                delete modal.dataset.currentAnswers;
                delete modal.dataset.currentRightColumn;
                updateQuestionForm();
                updatePreview();
            });
        });

        // Закрытие модального окна при клике вне его
        elements.questionTypeModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }

    // Показать модальное окно выбора типа вопроса
    function showQuestionTypeModal(isNewQuestion = false) {
        if (!isNewQuestion) {
            // Сохраняем текущие данные перед сменой типа
            const currentQuestion = state.questions[state.currentQuestionIndex];
            document.getElementById('questionTypeModal').dataset.currentText = currentQuestion.text;
            document.getElementById('questionTypeModal').dataset.currentAnswers = currentQuestion.answers.join('\n');
            document.getElementById('questionTypeModal').dataset.currentRightColumn = currentQuestion.rightColumn?.join('\n') || '';
        }
        elements.questionTypeModal.style.display = 'flex';
    }

    // Обработчики для разделителей
    function setupSplittersDrag() {
        let isVerticalDragging = false;
        let isHorizontalDragging = false;
        
        elements.verticalSplitter.addEventListener('mousedown', (e) => {
            isVerticalDragging = true;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
        
        elements.horizontalSplitter.addEventListener('mousedown', (e) => {
            isHorizontalDragging = true;
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isVerticalDragging) {
                const containerRect = elements.editPanel.parentElement.getBoundingClientRect();
                const newLeftWidth = (e.clientX - containerRect.left) / containerRect.width * 100;
                
                if (newLeftWidth > 20 && newLeftWidth < 80) {
                    elements.editPanel.style.flex = `0 0 ${newLeftWidth}%`;
                    elements.previewPanel.style.flex = `0 0 ${100 - newLeftWidth}%`;
                }
            }
            
            if (isHorizontalDragging) {
                const containerRect = document.querySelector('.main-split-container').getBoundingClientRect();
                const newTopHeight = (e.clientY - containerRect.top) / containerRect.height * 100;
                
                if (newTopHeight > 30 && newTopHeight < 90) {
                    document.querySelector('.content-split-container').style.flex = `0 0 ${newTopHeight}%`;
                    elements.settingsPanel.style.flex = `0 0 ${100 - newTopHeight}%`;
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            isVerticalDragging = false;
            isHorizontalDragging = false;
            document.body.style.cursor = '';
        });
    }

    // Обработчик изменения правого столбца для типа "Сопоставить"
    function handleRightColumnChange(e) {
        const answers = e.target.value.split('\n').filter(answer => answer.trim() !== '');
        state.questions[state.currentQuestionIndex].rightColumn = answers.length > 0 ? answers : [""];
        updatePreview();
    }

    // Обработчик изменения текста ответов
    function handleAnswersTextChange(e) {
        const answers = e.target.value.split('\n').filter(answer => answer.trim() !== '');
        state.questions[state.currentQuestionIndex].answers = answers.length > 0 ? answers : [""];
        updatePreview();
    }

    // Настройка обработчиков для панели настроек
    function setupSettingsListeners() {
        // Переключение вкладок
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-settings`).classList.add('active');
            });
        });

        // Настройки фона
        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            state.styles.backgroundColor = e.target.value;
            document.getElementById('backgroundColorHex').value = e.target.value;
            updatePreviewBackground();
            updatePreview();
        });

        document.getElementById('backgroundColorHex').addEventListener('input', (e) => {
            const color = e.target.value;
            if (tinycolor(color).isValid() || color === 'transparent') {
                state.styles.backgroundColor = color === 'transparent' ? 'transparent' : tinycolor(color).toHexString();
                document.getElementById('backgroundColor').value = color === 'transparent' ? '#000000' : tinycolor(color).toHexString();
                updatePreviewBackground();
                updatePreview();
            }
        });

        // Кнопки прозрачности
        document.querySelectorAll('.btn-transparent').forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                state.styles[target] = 'transparent';
                const colorInput = document.getElementById(target);
                const hexInput = document.getElementById(`${target}Hex`);
                colorInput.value = '#000000';
                hexInput.value = 'transparent';
                
                if (target in state.colorLinks) {
                    const linkedProp = state.colorLinks[target];
                    state.styles[linkedProp] = 'transparent';
                    document.getElementById(linkedProp).value = '#000000';
                    document.getElementById(`${linkedProp}Hex`).value = 'transparent';
                }
                
                updatePreview();
            });
        });

        // Кнопки связи цветов
        document.querySelectorAll('.btn-link').forEach(btn => {
            btn.addEventListener('click', function() {
                const source = this.getAttribute('data-source');
                const target = this.getAttribute('data-target');
                
                if (source === 'lockAspectRatio') {
                    state.styles.aspectRatioLocked = !state.styles.aspectRatioLocked;
                    this.classList.toggle('active');
                    if (state.styles.aspectRatioLocked) {
                        state.styles.aspectRatio = state.styles.exportWidth / state.styles.exportHeight;
                    }
                    return;
                }
                
                const sourceValue = state.styles[source];
                state.styles[target] = sourceValue;
                
                const targetColorInput = document.getElementById(target);
                const targetHexInput = document.getElementById(`${target}Hex`);
                
                targetColorInput.value = sourceValue === 'transparent' ? '#000000' : sourceValue;
                targetHexInput.value = sourceValue;
                
                updatePreview();
            });
        });

        // Обработчики для всех настроек
        const styleProperties = [
            'fontFamily', 'questionTextColor', 'questionBgColor', 'questionBorderColor',
            'questionFontSize', 'answerTextColor', 'answerBgColor', 'answerBorderColor',
            'answerFontSize', 'borderRadius', 'questionPadding', 'answerPadding',
            'questionMargin', 'answerMargin', 'answerIndent', 'exportWidth',
            'exportHeight', 'exportScale', 'exportBgColor'
        ];

        styleProperties.forEach(prop => {
            const element = document.getElementById(prop);
            if (element) {
                element.addEventListener('input', (e) => {
                    let value = e.target.value;
                    
                    // Для числовых значений
                    if (['FontSize', 'Radius', 'Padding', 'Margin', 'Indent', 'Width', 'Height', 'Scale'].some(suffix => prop.endsWith(suffix))) {
                        value = parseInt(value) || 0;
                    }
                    
                    // Для цветовых значений
                    if (prop.endsWith('Color') && !prop.startsWith('export')) {
                        const hexInput = document.getElementById(`${prop}Hex`);
                        if (e.target.type === 'color') {
                            hexInput.value = value;
                        } else {
                            value = value === 'transparent' ? 'transparent' : tinycolor(value).toHexString();
                            if (tinycolor(value).isValid()) {
                                document.getElementById(prop).value = value === 'transparent' ? '#000000' : value;
                            }
                        }
                        
                        // Обновляем связанные цвета
                        if (prop in state.colorLinks && state.styles.aspectRatioLocked) {
                            const linkedProp = state.colorLinks[prop];
                            state.styles[linkedProp] = value;
                            document.getElementById(linkedProp).value = value === 'transparent' ? '#000000' : value;
                            document.getElementById(`${linkedProp}Hex`).value = value;
                        }
                    }
                    
                    state.styles[prop] = value;
                    
                    // Для размеров экспорта с сохранением пропорций
                    if ((prop === 'exportWidth' || prop === 'exportHeight') && state.styles.aspectRatioLocked) {
                        if (prop === 'exportWidth') {
                            state.styles.exportHeight = Math.round(state.styles.exportWidth / state.styles.aspectRatio);
                            document.getElementById('exportHeight').value = state.styles.exportHeight;
                        } else {
                            state.styles.exportWidth = Math.round(state.styles.exportHeight * state.styles.aspectRatio);
                            document.getElementById('exportWidth').value = state.styles.exportWidth;
                        }
                    }
                    
                    if (prop.startsWith('export')) {
                        updateExportPreview();
                    } else {
                        updatePreview();
                    }
                });
            }
        });

        // Обработчики для hex-полей цветов
        const colorHexInputs = [
            'questionTextColorHex', 'questionBgColorHex', 'questionBorderColorHex',
            'answerTextColorHex', 'answerBgColorHex', 'answerBorderColorHex',
            'exportBgColorHex'
        ];

        colorHexInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                const prop = id.replace('Hex', '');
                const colorInput = document.getElementById(prop);
                const value = e.target.value;
                
                if (value === 'transparent' || tinycolor(value).isValid()) {
                    state.styles[prop] = value === 'transparent' ? 'transparent' : tinycolor(value).toHexString();
                    colorInput.value = value === 'transparent' ? '#000000' : tinycolor(value).toHexString();
                    
                    // Обновляем связанные цвета
                    if (prop in state.colorLinks && state.styles.aspectRatioLocked) {
                        const linkedProp = state.colorLinks[prop];
                        state.styles[linkedProp] = state.styles[prop];
                        document.getElementById(linkedProp).value = state.styles[prop] === 'transparent' ? '#000000' : state.styles[prop];
                        document.getElementById(`${linkedProp}Hex`).value = state.styles[prop];
                    }
                    
                    if (prop.startsWith('export')) {
                        updateExportPreview();
                    } else {
                        updatePreview();
                    }
                }
            });
        });

        // Аккордеоны
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.closest('.style-accordion');
                const content = accordion.querySelector('.accordion-content');
                const icon = header.querySelector('.material-icons');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.textContent = 'expand_more';
                } else {
                    content.style.display = 'none';
                    icon.textContent = 'chevron_right';
                }
            });
        });
    }

    // Навигация по вопросам
    function navigateQuestions(direction) {
        const newIndex = state.currentQuestionIndex + direction;
        
        if (newIndex >= 0 && newIndex < state.questions.length) {
            state.currentQuestionIndex = newIndex;
            updateQuestionForm();
        }
    }

    // Добавление нового вопроса
    function addNewQuestion(type = 'qa') {
        const newNumber = state.questions.length + 1;
        state.questions.push({
            type: type,
            number: newNumber.toString(),
            text: "",
            answers: type === 'match' ? ["", ""] : [""],
            rightColumn: type === 'match' ? ["", ""] : []
        });
        
        state.currentQuestionIndex = state.questions.length - 1;
        updateQuestionForm();
    }

    // Удаление текущего вопроса
    function deleteCurrentQuestion() {
        if (state.questions.length > 1) {
            state.questions.splice(state.currentQuestionIndex, 1);
            
            // Обновляем номера оставшихся вопросов
            state.questions.forEach((q, i) => {
                q.number = (i + 1).toString();
            });
            
            if (state.currentQuestionIndex >= state.questions.length) {
                state.currentQuestionIndex = state.questions.length - 1;
            }
            
            updateQuestionForm();
            updatePreview();
        }
    }

    // Обновление формы вопроса
    function updateQuestionForm() {
        const currentQuestion = state.questions[state.currentQuestionIndex];
        
        elements.questionNumber.value = currentQuestion.number;
        elements.questionText.value = currentQuestion.text;
        elements.answersText.value = currentQuestion.answers.join('\n');
        
        // Настройки для разных типов вопросов
        switch(currentQuestion.type) {
            case 'qa':
                elements.questionTextLabel.textContent = 'Текст вопроса:';
                elements.answersTextLabel.textContent = 'Варианты ответов (каждый ответ с новой строки):';
                document.querySelector('.match-fields').style.display = 'none';
                break;
            case 'match':
                elements.questionTextLabel.textContent = 'Формулировка задания:';
                elements.answersTextLabel.textContent = 'Левый столбец (каждый элемент с новой строки):';
                document.querySelector('.match-fields').style.display = 'block';
                elements.rightColumnText.value = currentQuestion.rightColumn.join('\n');
                break;
            case 'fill':
                elements.questionTextLabel.textContent = 'Формулировка задания';
                elements.answersTextLabel.textContent = 'Текст с пропущенным словом:';
                document.querySelector('.match-fields').style.display = 'none';
                break;
            case 'solve':
                elements.questionTextLabel.textContent = 'Пример:';
                elements.answersTextLabel.textContent = 'Поле для ответа (не заполняйте это поле)';
                document.querySelector('.match-fields').style.display = 'none';
        }
        
        // Обновляем счетчик вопросов
        elements.questionCounter.textContent = `Вопрос ${state.currentQuestionIndex + 1} из ${state.questions.length}`;
        
        // Обновляем состояние кнопок навигации
        elements.prevQuestion.disabled = state.currentQuestionIndex === 0;
        elements.nextQuestion.innerHTML = state.currentQuestionIndex === state.questions.length - 1 
            ? '<span class="material-icons">library_add</span>' 
            : '<span class="material-icons">chevron_right</span>';
        elements.deleteQuestion.disabled = state.questions.length <= 1;
    }

    // Обработчик изменения номера вопроса
    function handleQuestionNumberChange(e) {
        state.questions[state.currentQuestionIndex].number = e.target.value;
        updatePreview();
    }

    // Обработчик изменения текста вопроса
    function handleQuestionTextChange(e) {
        state.questions[state.currentQuestionIndex].text = e.target.value;
        updatePreview();
    }

    // Обновление фона предпросмотра
    function updatePreviewBackground() {
        elements.previewBackground.style.backgroundColor = state.styles.backgroundColor === 'transparent' ? 
            'transparent' : state.styles.backgroundColor;
    }

    // Обновление предпросмотра
    function updatePreview() {
        elements.previewContent.innerHTML = '';
        
        state.questions.forEach((question, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-preview';
            questionDiv.style.marginBottom = `${state.styles.questionMargin}px`;
            
            // Заголовок вопроса (номер + текст)
            const questionHeader = document.createElement('div');
            questionHeader.className = 'question-header';
            
            // Номер вопроса
            const numberDiv = document.createElement('div');
            numberDiv.className = 'question-number';
            numberDiv.textContent = question.number;
            numberDiv.style.border = `2px solid ${state.styles.questionBorderColor === 'transparent' ? 'transparent' : state.styles.questionBorderColor}`;
            numberDiv.style.borderRadius = `${state.styles.borderRadius}px`;
            numberDiv.style.backgroundColor = state.styles.questionBgColor === 'transparent' ? 'transparent' : state.styles.questionBgColor;
            numberDiv.style.color = state.styles.questionTextColor;
            numberDiv.style.fontSize = `${state.styles.questionFontSize}px`;
            numberDiv.style.fontFamily = state.styles.fontFamily;
            numberDiv.style.padding = `${state.styles.questionPadding}px`;
            
            // Текст вопроса
            const textDiv = document.createElement('div');
            textDiv.className = 'question-text';
            textDiv.textContent = question.text;
            textDiv.style.border = `1px solid ${state.styles.questionBorderColor === 'transparent' ? 'transparent' : state.styles.questionBorderColor}`;
            textDiv.style.borderRadius = `${state.styles.borderRadius}px`;
            textDiv.style.backgroundColor = state.styles.questionBgColor === 'transparent' ? 'transparent' : state.styles.questionBgColor;
            textDiv.style.color = state.styles.questionTextColor;
            textDiv.style.fontSize = `${state.styles.questionFontSize}px`;
            textDiv.style.fontFamily = state.styles.fontFamily;
            textDiv.style.padding = `${state.styles.questionPadding}px`;
            
            questionHeader.appendChild(numberDiv);
            questionHeader.appendChild(textDiv);
            
            // Варианты ответов
            const answersDiv = document.createElement('div');
            answersDiv.className = 'answers-preview';
            answersDiv.style.marginLeft = `${state.styles.answerIndent}px`;
            
            // Обработка разных типов вопросов
            switch(question.type) {
                case 'qa':
                    // Обычный вопрос-ответ
                    question.answers.forEach((answer, aIndex) => {
                        if (answer.trim() === "") return;
                        
                        const answerDiv = document.createElement('div');
                        answerDiv.className = 'answer-preview';
                        answerDiv.textContent = answer;
                        answerDiv.style.border = `1px solid ${state.styles.answerBorderColor === 'transparent' ? 'transparent' : state.styles.answerBorderColor}`;
                        answerDiv.style.borderRadius = `${state.styles.borderRadius}px`;
                        answerDiv.style.backgroundColor = state.styles.answerBgColor === 'transparent' ? 'transparent' : state.styles.answerBgColor;
                        answerDiv.style.color = state.styles.answerTextColor;
                        answerDiv.style.fontSize = `${state.styles.answerFontSize}px`;
                        answerDiv.style.fontFamily = state.styles.fontFamily;
                        answerDiv.style.padding = `${state.styles.answerPadding}px`;
                        answerDiv.style.marginBottom = `${state.styles.answerMargin}px`;
                        
                        answersDiv.appendChild(answerDiv);
                    });
                    break;
                    
                case 'match':
                    // Сопоставление (два столбца)
                    const matchContainer = document.createElement('div');
                    matchContainer.style.display = 'flex';
                    matchContainer.style.gap = '20px';
                    
                    const leftColumn = document.createElement('div');
                    leftColumn.style.flex = '1';
                    
                    const rightColumn = document.createElement('div');
                    rightColumn.style.flex = '1';
                    
                    // Левый столбец
                    question.answers.forEach((answer, aIndex) => {
                        if (answer.trim() === "") return;
                        
                        const answerDiv = document.createElement('div');
                        answerDiv.className = 'answer-preview';
                        answerDiv.textContent = answer;
                        answerDiv.style.border = `1px solid ${state.styles.answerBorderColor === 'transparent' ? 'transparent' : state.styles.answerBorderColor}`;
                        answerDiv.style.borderRadius = `${state.styles.borderRadius}px`;
                        answerDiv.style.backgroundColor = state.styles.answerBgColor === 'transparent' ? 'transparent' : state.styles.answerBgColor;
                        answerDiv.style.color = state.styles.answerTextColor;
                        answerDiv.style.fontSize = `${state.styles.answerFontSize}px`;
                        answerDiv.style.fontFamily = state.styles.fontFamily;
                        answerDiv.style.padding = `${state.styles.answerPadding}px`;
                        answerDiv.style.marginBottom = `${state.styles.answerMargin}px`;
                        
                        leftColumn.appendChild(answerDiv);
                    });
                    
                    // Правый столбец
                    question.rightColumn.forEach((answer, aIndex) => {
                        if (answer.trim() === "") return;
                        
                        const answerDiv = document.createElement('div');
                        answerDiv.className = 'answer-preview';
                        answerDiv.textContent = answer;
                        answerDiv.style.border = `1px solid ${state.styles.answerBorderColor === 'transparent' ? 'transparent' : state.styles.answerBorderColor}`;
                        answerDiv.style.borderRadius = `${state.styles.borderRadius}px`;
                        answerDiv.style.backgroundColor = state.styles.answerBgColor === 'transparent' ? 'transparent' : state.styles.answerBgColor;
                        answerDiv.style.color = state.styles.answerTextColor;
                        answerDiv.style.fontSize = `${state.styles.answerFontSize}px`;
                        answerDiv.style.fontFamily = state.styles.fontFamily;
                        answerDiv.style.padding = `${state.styles.answerPadding}px`;
                        answerDiv.style.marginBottom = `${state.styles.answerMargin}px`;
                        
                        rightColumn.appendChild(answerDiv);
                    });
                    
                    matchContainer.appendChild(leftColumn);
                    matchContainer.appendChild(rightColumn);
                    answersDiv.appendChild(matchContainer);
                    break;
                    
                case 'fill':
                    // Вставь пропущенное
                    if (question.answers[0] && question.answers[0].trim() !== "") {
                        const answerDiv = document.createElement('div');
                        answerDiv.className = 'answer-preview';
                        answerDiv.textContent = question.answers[0];
                        answerDiv.style.border = `1px solid ${state.styles.answerBorderColor === 'transparent' ? 'transparent' : state.styles.answerBorderColor}`;
                        answerDiv.style.borderRadius = `${state.styles.borderRadius}px`;
                        answerDiv.style.backgroundColor = state.styles.answerBgColor === 'transparent' ? 'transparent' : state.styles.answerBgColor;
                        answerDiv.style.color = state.styles.answerTextColor;
                        answerDiv.style.fontSize = `${state.styles.answerFontSize}px`;
                        answerDiv.style.fontFamily = state.styles.fontFamily;
                        answerDiv.style.padding = `${state.styles.answerPadding}px`;
                        answerDiv.style.marginBottom = `${state.styles.answerMargin}px`;
                        
                        answersDiv.appendChild(answerDiv);
                    }
                    break;
                    
                case 'solve':
                    // Решить пример
                    const exampleDiv = document.createElement('div');
                    exampleDiv.style.marginBottom = '10px';

                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'answer-preview';
                    answerDiv.style.border = `1px dashed ${state.styles.answerBorderColor === 'transparent' ? 'transparent' : state.styles.answerBorderColor}`;
                    answerDiv.style.borderRadius = `${state.styles.borderRadius}px`;
                    answerDiv.style.backgroundColor = state.styles.answerBgColor === 'transparent' ? 'transparent' : state.styles.answerBgColor;
                    answerDiv.style.minHeight = '30px';
                    answerDiv.style.fontSize = `${state.styles.answerFontSize}px`;
                    answerDiv.style.fontFamily = state.styles.fontFamily;
                    answerDiv.style.padding = `${state.styles.answerPadding}px`;

                    answersDiv.appendChild(exampleDiv);
                    answersDiv.appendChild(answerDiv);
                    break;
            }
            
            questionDiv.appendChild(questionHeader);
            questionDiv.appendChild(answersDiv);
            elements.previewContent.appendChild(questionDiv);
        });
    }

    // Обновление предпросмотра экспорта
    function updateExportPreview() {
        elements.exportPreview.innerHTML = '';
        
        const exportContainer = document.createElement('div');
        exportContainer.style.width = `${state.styles.exportWidth}px`;
        exportContainer.style.height = `${state.styles.exportHeight}px`;
        exportContainer.style.backgroundColor = state.styles.exportBgColor === 'transparent' ? 'transparent' : state.styles.exportBgColor;
        exportContainer.style.position = 'relative';
        exportContainer.style.overflow = 'hidden';
        
        // Клонируем содержимое предпросмотра
        const previewClone = elements.previewContent.cloneNode(true);
        previewClone.style.width = '100%';
        previewClone.style.height = 'auto';
        previewClone.style.transformOrigin = 'top left';
        
        // Масштабируем содержимое, чтобы оно поместилось
        const scale = Math.min(
            state.styles.exportWidth / elements.previewContent.scrollWidth,
            state.styles.exportHeight / elements.previewContent.scrollHeight
        ) * state.styles.exportScale;
        
        previewClone.style.transform = `scale(${scale})`;
        
        exportContainer.appendChild(previewClone);
        elements.exportPreview.appendChild(exportContainer);
    }

    // Экспорт в PNG
    function exportToPNG() {
        const exportContainer = document.createElement('div');
        exportContainer.style.width = `${state.styles.exportWidth}px`;
        exportContainer.style.height = `${state.styles.exportHeight}px`;
        exportContainer.style.backgroundColor = state.styles.exportBgColor === 'transparent' ? 'transparent' : state.styles.exportBgColor;
        exportContainer.style.position = 'fixed';
        exportContainer.style.left = '-9999px';
        exportContainer.style.overflow = 'hidden';
        
        // Клонируем содержимое предпросмотра
        const previewClone = elements.previewContent.cloneNode(true);
        previewClone.style.width = '100%';
        previewClone.style.height = 'auto';
        previewClone.style.transformOrigin = 'top left';
        
        // Масштабируем содержимое
        const scale = Math.min(
            state.styles.exportWidth / elements.previewContent.scrollWidth,
            state.styles.exportHeight / elements.previewContent.scrollHeight
        ) * state.styles.exportScale;
        
        previewClone.style.transform = `scale(${scale})`;
        
        exportContainer.appendChild(previewClone);
        document.body.appendChild(exportContainer);
        
        html2canvas(exportContainer, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: state.styles.exportBgColor === 'transparent' ? null : state.styles.exportBgColor
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `question-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            document.body.removeChild(exportContainer);
        });
    }

    // Загрузка пользовательского шрифта
    function loadCustomFont() {
        const fontUrl = elements.customFontUrl.value.trim();
        if (!fontUrl) return;
        
        try {
            const link = document.createElement('link');
            link.href = fontUrl;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            
            // Пытаемся извлечь название шрифта из URL
            const fontNameMatch = fontUrl.match(/family=([^&:]+)/);
            if (fontNameMatch) {
                const fontName = fontNameMatch[1].replace(/\+/g, ' ');
                state.styles.fontFamily = fontName.includes(' ') ? `'${fontName}', sans-serif` : `${fontName}, sans-serif`;
                document.getElementById('fontFamily').value = state.styles.fontFamily;
                updatePreview();
            }
        } catch (e) {
            console.error('Ошибка загрузки шрифта:', e);
        }
    }

    // Инициализация приложения
    init();
});
