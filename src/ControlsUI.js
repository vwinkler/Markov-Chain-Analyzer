class ControlsUI {
    constructor(graph) {
        this.graph = graph;
    }

    displayControls() {
        this.displayPermalink(this.graph);
        this.displayBugreportLink(this.graph);
    }

    displayPermalink() {
        let url = this.makePermanentUrl(this.graph);
        document.getElementById("permalink").href = url.toString();
    }

    displayBugreportLink() {
        let newIssueUrl = new URL("https://github.com/vwinkler/Markov-Chain-Analyzer/issues/new");
        let issueBody = `\n\n\n[Link to a related problematic this.graph](${this.makePermanentUrl(this.graph)})`;
        newIssueUrl.searchParams.append("body", issueBody);
        document.getElementById("bugreport").href = newIssueUrl.toString();
    }

    makePermanentUrl() {
        let graphToUrlQueryConverter = new GraphToUrlQueryConverter(this.graph);
        let urlSearchParams = graphToUrlQueryConverter.makeQuery();
        let url = new URL(document.location);
        url.search = this.overwriteSearchParams(url.searchParams, urlSearchParams).toString();
        return url;
    }

    overwriteSearchParams(paramsToOverwrite, newParams) {
        let result = new URLSearchParams(paramsToOverwrite);
        for (const [key, value] of newParams.entries()) {
            if (result.has(key)) {
                result.delete(key);
            }
            result.append(key, value);
        }
        return result;
    }
}