export const topic2regex = (topic) => {
    return new RegExp(`^${topic}\$`
        .replaceAll('+', '[^/]*')
        .replace('/#', '(|/.*)')
    )
};