import { getOctokit, context } from "@actions/github";
import core from "@actions/core";

/**
 * 	releaseId: number;
 * @param releaseId
 * @returns {Promise<void>}
 */
export default async function uploadVersionJSON({ releaseId }) {
  try {
    if (process.env.GITHUB_TOKEN === undefined) {
      throw new Error("GITHUB_TOKEN is required");
    }

    const github = getOctokit(process.env.GITHUB_TOKEN);

    const versionFilename = "latest.json";

    const assets = await github.rest.repos.listReleaseAssets({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
    });
    const asset = assets.data.find((e) => e.name === versionFilename);

    if (!asset) {
      core.setFailed(`Asset ${versionFilename} not found`);
    }

    const assetContent = await (await fetch(asset.browser_download_url)).json();

    const gist = await github.rest.gists.get({
      gist_id: process.env.GIST_ID,
    });

    const file = gist.data.files[versionFilename];

    if (!file) {
      core.setFailed(`File ${versionFilename} not found`);
    }

    const action = await github.rest.gists.update({
      gist_id: process.env.GIST_ID,
      files: {
        [versionFilename]: {
          content: JSON.stringify(assetContent, null, 2),
        },
      },
    });
    core.info("Succesfully updated latest.json");
    core.info("------------------------------------");
    core.info(
      action.data?.files
        ? JSON.stringify(action.data?.files[versionFilename], null, 2)
        : {}
    );
    core.info("------------------------------------");
  } catch (error) {
    core.setFailed(error);
  }
}

function run() {
  const releaseId = parseInt(process.argv[2], 10);
  uploadVersionJSON({ releaseId });
}

run();
