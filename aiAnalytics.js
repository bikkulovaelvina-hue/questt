// ========== AI МОДУЛЬ ==========
const AIAnalytics = (function() {
    let answers = [];
    let currentSceneAnswer = null;
    
    function getScaleName(sceneCode) {
        const scaleMap = {
           "2": ["Аффективность", "Уникальность"], "3A": ["Демонстративность", "Уникальность", "Временная перспектива"],
            "3B": ["Демонстративность", "Уникальность", "Временная перспектива"], "5": ["Аффективность"],
            "6": ["Демонстративность", "Аффективность"], "8": ["Аффективность"], "11": ["Аффективность"],
            "12": ["Аффективность"], "14": ["Демонстративность", "Уникальность"],
            "16A": ["Демонстративность", "Уникальность", "Социальный пессимизм"],
            "16B": ["Демонстративность", "Уникальность", "Социальный пессимизм"], "17": ["Социальный пессимизм"],
            "19": ["Демонстративность", "Уникальность", "Временная перспектива"],
            "20": ["Несостоятельность", "Временная перспектива"], "21": ["Несостоятельность", "Временная перспектива"],
            "22": ["Несостоятельность"], "23": ["Несостоятельность"], "24": ["Социальный пессимизм"],
            "25": ["Социальный пессимизм"], "26": ["Социальный пессимизм"], 
            "27": ["Слом культурных барьеров"], "28": ["Слом культурных барьеров"], "30": ["Максимализм"],
            "31": ["Антисуицидальный фактор"], "33": ["Социальный пессимизм"], "35": ["Слом культурных барьеров"],
            "37": ["Максимализм"], "39": ["Временная перспектива"], "41": ["Временная перспектива"],
            "42": ["Антисуицидальный фактор"], "44": ["Несостоятельность"]
        };
        return scaleMap[sceneCode] || "—";
    }
    
    function startScene(sceneId, sceneCode) {
        currentSceneAnswer = {
            sceneId: sceneId,
            sceneCode: sceneCode,
            selectedChoice: null,
            selectedText: null,
            selectedScore: null,
            timeSpent: null,
            changed: false,
            previousChoice: null,
            previousText: null,
            previousScore: null
        };
    }
    
    function recordChoice(choiceKey, choiceText, score, timeSpent, wasChanged, prevKey, prevText, prevScore) {
        if (!currentSceneAnswer) return;
        
        if (!wasChanged) {
            currentSceneAnswer.selectedChoice = choiceKey;
            currentSceneAnswer.selectedText = choiceText;
            currentSceneAnswer.selectedScore = score;
            currentSceneAnswer.timeSpent = timeSpent;
            currentSceneAnswer.changed = false;
        } else {
            currentSceneAnswer.changed = true;
            currentSceneAnswer.previousChoice = prevKey;
            currentSceneAnswer.previousText = prevText;
            currentSceneAnswer.previousScore = prevScore;
            currentSceneAnswer.selectedChoice = choiceKey;
            currentSceneAnswer.selectedText = choiceText;
            currentSceneAnswer.selectedScore = score;
            currentSceneAnswer.timeSpent = timeSpent;
        }
    }
    
    function endScene() {
        if (currentSceneAnswer && currentSceneAnswer.selectedChoice !== null) {
            answers.push({ ...currentSceneAnswer });
        }
        currentSceneAnswer = null;
    }
    
    function reset() {
        answers = [];
        currentSceneAnswer = null;
        console.log("AI: reset");
    }
    
    function getHTMLReport() {
        if (answers.length === 0) return '';
        
        // Вычисляем медиану
        const times = answers.map(a => a.timeSpent).sort((a, b) => a - b);
        const median = times.length % 2 === 0 
            ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
            : times[Math.floor(times.length / 2)];
        
        // Категоризируем ответы
        const slowEpisodes = [];
        const fastEpisodes = [];
        const changedEpisodes = [];
        
        answers.forEach(a => {
            const ratio = a.timeSpent / median;
            const scaleName = getScaleName(a.sceneCode);
            
            if (ratio > 1.3) {
                let deviation = (ratio > 2.0) ? "сильное" : "умеренное";
                slowEpisodes.push({
                    sceneId: a.sceneId,
                    scaleName: scaleName,
                    timeSpent: a.timeSpent,
                    deviationPercent: Math.round((ratio - 1) * 100),
                    deviation: deviation
                });
            } else if (ratio < 0.7) {
                const fastRatio = median / a.timeSpent;
                let deviation = (fastRatio > 2.0) ? "сильное" : "умеренное";
                fastEpisodes.push({
                    sceneId: a.sceneId,
                    scaleName: scaleName,
                    timeSpent: a.timeSpent,
                    deviationPercent: Math.round((fastRatio - 1) * 100),
                    deviation: deviation
                });
            }
            
            if (a.changed) {
                changedEpisodes.push({
                    sceneId: a.sceneId,
                    scaleName: scaleName
                });
            }
        });
        
        let html = '<div style="margin-top:20px; border-top:1px solid rgba(139,92,246,0.3); padding-top:15px;">';
        
        html += `<div style="margin-bottom:15px; padding:8px 12px; background:rgba(0,0,0,0.3); border-radius:12px;">
                    <strong>Норма:</strong> ${median.toFixed(1)} сек на ответ
                 </div>`;
        
        html += '<details style="margin-bottom:10px;"><summary style="cursor:pointer; color:#c084fc;">Выявленные поведенческие паттерны</summary>';
        
        // Эпизоды увеличенного времени ответа
        if (slowEpisodes.length > 0) {
            html += '<details style="margin-left:20px; margin-top:10px;"><summary style="cursor:pointer; color:#c084fc;">Эпизоды увеличенного времени ответа</summary><ul style="margin-top:8px; margin-left:20px;">';
            slowEpisodes.forEach(e => {
                html += `<li><strong>Сцена ${e.sceneId}</strong> — ${e.scaleName}<br>
                         <span style="color:#e2e8f0;">Время: ${e.timeSpent}с (${e.deviationPercent}% дольше нормы, ${e.deviation} отклонение)</span></li>`;
            });
            html += '</ul></details>';
        } else {
            html += '<div style="margin-left:20px; margin-top:10px; color:#c084fc;">Эпизодов увеличенного времени ответа не зафиксировано</div>';
        }
        
        // Эпизоды быстрого выбора ответа
        if (fastEpisodes.length > 0) {
            html += '<details style="margin-left:20px; margin-top:10px;"><summary style="cursor:pointer; color:#c084fc;">Эпизоды быстрого выбора ответа</summary><ul style="margin-top:8px; margin-left:20px;">';
            fastEpisodes.forEach(e => {
                html += `<li><strong>Сцена ${e.sceneId}</strong> — ${e.scaleName}<br>
                         <span style="color:#e2e8f0;">Время: ${e.timeSpent}с (${e.deviationPercent}% быстрее нормы, ${e.deviation} отклонение)</span></li>`;
            });
            html += '</ul></details>';
        } else {
            html += '<div style="margin-left:20px; margin-top:10px; color:#c084fc;">Эпизодов быстрого выбора ответа не зафиксировано</div>';
        }
        
        // Эпизоды изменения первоначального выбора
        if (changedEpisodes.length > 0) {
            html += '<details style="margin-left:20px; margin-top:10px;"><summary style="cursor:pointer; color:#c084fc;">Эпизоды изменения первоначального выбора</summary><ul style="margin-top:8px; margin-left:20px;">';
            changedEpisodes.forEach(e => {
                html += `<li><strong>Сцена ${e.sceneId}</strong> — ${e.scaleName}</li>`;
            });
            html += '</ul></details>';
        } else {
            html += '<div style="margin-left:20px; margin-top:10px; color:#c084fc;">Эпизодов изменения первоначального выбора не зафиксировано</div>';
        }
        
        html += '</details></div>';
        return html;
    }
    
    function getRawData() {
        return { answers: answers, generatedAt: new Date().toISOString() };
    }
    
    return {
        startScene: startScene,
        recordChoice: recordChoice,
        endScene: endScene,
        reset: reset,
        getHTMLReport: getHTMLReport,
        getRawData: getRawData
    };
})();
console.log("AI модуль загружен");
