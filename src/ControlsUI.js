class ControlsUI {
    constructor(graph) {
        this.graph = graph;
        this.lastUpdateDate = ControlsUI.addSecondsToDate(-60, new Date(Date.now()));
        this.enablePermalinkAgeDisplay();
    }

    static addSecondsToDate(seconds, date) {
        let result = new Date(date);
        result.setSeconds(result.getSeconds() + seconds);
        return result;
    }

    enablePermalinkAgeDisplay() {
        let that = this;
        let updateAge = function () {
            let elapsedSeconds = (new Date(Date.now()) - that.lastUpdateDate) / 1000;
            let timeText = ControlsUI.formatPermalinkAge(elapsedSeconds);
            document.getElementById("permalinkAge").innerHTML = "" + timeText + "s";
        };
        updateAge();
        setInterval(updateAge, 100);
    }

    static formatPermalinkAge(elapsedSeconds) {
        let timeText;
        if (elapsedSeconds <= 60) {
            timeText = "" + Math.round(elapsedSeconds / 10) * 10;
        } else {
            timeText = "> 60";
        }
        return timeText;
    }

    displayControls() {
        this.displayPermalink(this.graph);
        this.displayBugreportLink(this.graph);
    }

    displayPermalink() {
        let url = this.makePermanentUrl(this.graph);
        document.getElementById("permalink").href = url.toString();
        this.lastUpdateDate = new Date(Date.now());
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