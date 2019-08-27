const { COLLECTION } = require('radiks-server/app/lib/constants');

const list = async (radiksData, query) => {
  const match = {
    $match: {
      radiksType: 'Message',
    },
  };
  if (query) {
    if (query.lesserThan && query.lesserThan && !isNaN(query.lesserThan)) {
      match.$match.createdAt = {
        $lt: parseInt(query.lesserThan, 10)
      };
    }
    if (query.createdBy) {
      match.$match.createdBy = query.createdBy;
    }
  }
  const sort = {
    $sort: { createdAt: -1 },
  };
  const limit = {
    $limit: (query && query.limit && !isNaN(query.limit) ? parseInt(query.limit, 10) : 10),
  };

  const reactionsLookup = { 
    $lookup: {
      from: COLLECTION,
      as: 'reactions'
    } 
  };

  const pipeline = [match, sort, reactionsLookup];

  if (query && (query.reaction || query.reactionBy)) {
    const lookupRestrictions = [
      { $eq: [ "$messageId", "$$id" ] },
      { $eq: [ "$radiksType", "Reaction" ] }
    ];

    if (query.reactionBy) {
      lookupRestrictions.push({ $eq: [ "$username", query.reactionBy ] });
    }
    if (query.reaction && !isNaN(query.reaction)) {
      lookupRestrictions.push({ $eq: [ "$type", parseInt(query.reaction, 10) ] });
    }

    reactionsLookup.$lookup.let = { id: "$_id" };

    reactionsLookup.$lookup.pipeline = [{
      $match: {
        $expr: {
          $and: lookupRestrictions
        }
      }
    }];

    pipeline.push({ 
      $match: { 
        "reactions": { $ne: [] } 
      } 
    });
  } else {
    reactionsLookup.$lookup.localField = "_id";
    reactionsLookup.$lookup.foreignField = "messageId";
  }

  pipeline.push(limit);
  return await radiksData.aggregate(pipeline).toArray();
};

module.exports = {
  list
};
