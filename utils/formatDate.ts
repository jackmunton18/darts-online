export default function (dateString: string, options: any = null) {

    const _defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    }
    const date = new Date(dateString)
    return date.toLocaleDateString(
        navigator.language === 'en-US' ? 'en-US' : 'en-GB',
        options ?? _defaultOptions
    )
}