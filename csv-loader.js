// CSV Loader для standalone версии
class CSVLoader {
    constructor() {
        this.reflections = [];
        this.prompts = [];
    }

    async loadReflections() {
        try {
            const response = await fetch('reflections.csv');
            const text = await response.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            this.reflections = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length >= headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header.trim()] = values[index] ? values[index].trim() : '';
                        });
                        
                        // Пропускаем записи без разрешения
                        if (row.privacy_ok && row.privacy_ok.toLowerCase() === 'true') {
                            // Извлекаем слова из ответа
                            const answerWords = this.extractWords(row.answer_text || '');
                            const promptWords = this.extractWords(row.prompt_text || '');
                            
                            // Объединяем слова
                            let requiredWords = [...answerWords];
                            if (requiredWords.length < 3) {
                                requiredWords = [...requiredWords, ...promptWords.slice(0, 2)];
                            }
                            
                            // Ограничиваем количество слов
                            requiredWords = [...new Set(requiredWords)].slice(0, 5);
                            
                            this.reflections.push({
                                reflection_id: row.reflection_id,
                                prompt_text: row.prompt_text,
                                answer_text: row.answer_text,
                                insight_tags: row.insight_tags ? row.insight_tags.split(',').map(t => t.trim()) : [],
                                required_words: requiredWords
                            });
                        }
                    }
                }
            }
            
            console.log(`Загружено ${this.reflections.length} записей из reflections.csv`);
            return this.reflections;
        } catch (error) {
            console.error('Ошибка загрузки reflections.csv:', error);
            return this.getFallbackReflections();
        }
    }

    async loadPrompts() {
        try {
            const response = await fetch('prompts.csv');
            const text = await response.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            this.prompts = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length >= headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header.trim()] = values[index] ? values[index].trim() : '';
                        });
                        
                        this.prompts.push({
                            prompt_id: row.prompt_id,
                            text: row.text,
                            category: row.category
                        });
                    }
                }
            }
            
            console.log(`Загружено ${this.prompts.length} записей из prompts.csv`);
            return this.prompts;
        } catch (error) {
            console.error('Ошибка загрузки prompts.csv:', error);
            return this.getFallbackPrompts();
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    extractWords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        const stopWords = new Set([
            'что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто',
            'чтобы', 'если', 'то', 'и', 'в', 'на', 'с', 'по', 'о', 'об',
            'из', 'от', 'до', 'для', 'у', 'не', 'но', 'а', 'же', 'ли', 'бы',
            'вот', 'это', 'тот', 'такой', 'какой', 'весь', 'все', 'всё',
            'он', 'она', 'оно', 'они', 'я', 'ты', 'вы', 'мы', 'свой', 'твой',
            'ваш', 'наш', 'его', 'её', 'их', 'сегодня', 'завтра', 'потом',
            'сейчас', 'очень', 'быстро', 'медленно', 'иногда', 'часто', 'редко'
        ]);
        
        return words.filter(word => !stopWords.has(word));
    }

    getFallbackReflections() {
        return [
            {
                reflection_id: "R0001",
                prompt_text: "О чём ты сейчас беспокоишься? Что можно отпустить?",
                answer_text: "Почувствовал(а), что короткий перерыв помогает.",
                insight_tags: ["фокус"],
                required_words: ["короткий", "перерыв", "помогает"]
            },
            {
                reflection_id: "R0002",
                prompt_text: "Что получилось хорошо за последние 2–3 часа?",
                answer_text: "Замечаю, разговор с коллегой отвлёк.",
                insight_tags: ["цели"],
                required_words: ["разговор", "коллегой", "отвлёк"]
            },
            {
                reflection_id: "R0003",
                prompt_text: "Какая одна маленькая вещь поможет следующему шагу?",
                answer_text: "Почувствовал(а), что дыхание выравнивает фокус — попробую завтра снова.",
                insight_tags: ["граница-раб-лич"],
                required_words: ["дыхание", "выравнивает", "фокус"]
            },
            {
                reflection_id: "R0004",
                prompt_text: "За что ты благодарен(на) в работе сегодня?",
                answer_text: "Сегодня понял(а), что стоит закрыть лишние вкладки и стало легче.",
                insight_tags: ["перерыв"],
                required_words: ["закрыть", "лишние", "вкладки"]
            },
            {
                reflection_id: "R0005",
                prompt_text: "Что бы ты сделал(а) иначе в следующий раз?",
                answer_text: "Кажется, лучше записать следующий шаг и это сэкономит время.",
                insight_tags: ["план"],
                required_words: ["записать", "следующий", "шаг"]
            }
        ];
    }

    getFallbackPrompts() {
        return [
            { prompt_id: "P1", text: "Сделайте короткий вдох/выдох и продолжите. :)", category: "рефлексия" },
            { prompt_id: "P2", text: "Помните: маленькие шаги ведут к большим результатам.", category: "рефлексия" },
            { prompt_id: "P3", text: "Отдохните 5 минут и вернитесь к работе с новыми силами.", category: "рефлексия" },
            { prompt_id: "P4", text: "Попробуйте изменить подход к задаче.", category: "рефлексия" },
            { prompt_id: "P5", text: "Сосредоточьтесь на том, что действительно важно.", category: "рефлексия" }
        ];
    }
}
