function displayControls(graph) {
    displayPermalink(graph);
    displayBugreportLink(graph);
}

function displayPermalink(graph) {
    let url = makePermanentUrl(graph);
    document.getElementById("permalink").href = url.toString();
}

function displayBugreportLink(graph) {
    let newIssueUrl = new URL("https://github.com/vwinkler/Markov-Chain-Analyzer/issues/new");
    let issueBody = `\n\n\n[Link to a related problematic graph](${makePermanentUrl(graph)})`;
    newIssueUrl.searchParams.append("body", issueBody);
    document.getElementById("bugreport").href = newIssueUrl.toString();
}

function makePermanentUrl(graph) {
    let graphToUrlQueryConverter = new GraphToUrlQueryConverter(graph);
    let urlSearchParams = graphToUrlQueryConverter.makeQuery();
    let url = new URL(document.location);
    url.search = overwriteSearchParams(url.searchParams, urlSearchParams).toString();
    return url;
}

function overwriteSearchParams(paramsToOverwrite, newParams) {
    let result = new URLSearchParams(paramsToOverwrite);
    for (const [key, value] of newParams.entries()) {
        if (result.has(key)) {
            result.delete(key);
        }
        result.append(key, value);
    }
    return result;
}
