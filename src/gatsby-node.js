const getPlaceDetails = require("./getPlaceDetails");
const nodeFactory = require("./nodeFactory");

const resolvePlace = async ({
  apiKey,
  placeId,
  language,
  actions,
  createNodeId,
  store,
  cache,
  reporter,
}) => {
  const response = await getPlaceDetails(apiKey, placeId, language);

  if (response.data.status !== "OK") {
    throw new Error(
      "Request to Google API failed. " + response.data.error_message
    );
  }

  const place = response.data.result;
  place.id = placeId;

  const placeNode = nodeFactory.placeNode(place);
  delete placeNode.reviews;
  actions.createNode(placeNode);

  if (place.reviews) {
    for (const review of place.reviews) {
      review.id = review.time.toString();
      // Now passing additional parameters to `reviewNode`
      const reviewNode = await nodeFactory.reviewNode(review, {
        createNode: actions.createNode,
        createNodeId,
        store,
        cache,
        reporter,
      });
      actions.createNode(reviewNode);
    }
  }

  return;
};

exports.sourceNodes = async (
  { actions, createNodeId, store, cache, reporter },
  { apiKey, placeIds, placeId, language = "en-US" }
) => {
  try {
    // Backwards compatibility
    if (!placeIds) {
      console.warn(
        "gatsby-source-google-places has deprecated placeId. Use placeIds instead."
      );
      placeIds = placeId;
    }

    if (typeof placeIds === "string") {
      placeIds = [placeIds];
    }

    await Promise.all(
      placeIds.map((pid) =>
        resolvePlace({
          apiKey,
          placeId: pid,
          language,
          actions,
          createNodeId,
          store,
          cache,
          reporter,
        })
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
