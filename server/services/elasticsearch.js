/**
 * Elasticsearch 服务
 * 存储原始日志和行为链路数据
 */

const { Client } = require('@elastic/elasticsearch');

// 创建 ES 客户端
const client = new Client({
  node: process.env.ES_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ES_USERNAME || 'elastic',
    password: process.env.ES_PASSWORD || 'changeme',
  },
});

/**
 * 保存错误日志到 ES
 */
async function saveToElasticsearch(data) {
  try {
    const index = `error-logs-${getDateString()}`;

    const result = await client.index({
      index,
      document: {
        ...data,
        '@timestamp': new Date(data.timestamp).toISOString(),
      },
    });

    console.log(`[ES] Saved to ${index}:`, result._id);
    return result;
  } catch (error) {
    console.error('[ES] Save failed:', error);
    throw error;
  }
}

/**
 * 从 ES 查询错误详情
 */
async function getErrorFromES(errorId) {
  try {
    const result = await client.search({
      index: 'error-logs-*',
      body: {
        query: {
          match: {
            errorId,
          },
        },
        sort: [
          {
            timestamp: {
              order: 'desc',
            },
          },
        ],
        size: 1,
      },
    });

    if (result.hits.hits.length > 0) {
      return result.hits.hits[0]._source;
    }

    return null;
  } catch (error) {
    console.error('[ES] Query failed:', error);
    throw error;
  }
}

/**
 * 从 ES 查询 Session 详情
 */
async function getSessionFromES(sessionId) {
  try {
    const result = await client.search({
      index: 'sessions-*',
      body: {
        query: {
          match: {
            'session.sessionId': sessionId,
          },
        },
        sort: [
          {
            timestamp: {
              order: 'desc',
            },
          },
        ],
        size: 1,
      },
    });

    if (result.hits.hits.length > 0) {
      return result.hits.hits[0]._source;
    }

    return null;
  } catch (error) {
    console.error('[ES] Query session failed:', error);
    throw error;
  }
}

/**
 * 查询错误列表
 */
async function searchErrors(query) {
  try {
    const { page = 1, pageSize = 20, startTime, endTime, type, userId } = query;

    const must = [];

    if (type) {
      must.push({ match: { subType: type } });
    }

    if (userId) {
      must.push({ match: { 'session.userId': userId } });
    }

    if (startTime || endTime) {
      const range = { timestamp: {} };
      if (startTime) range.timestamp.gte = startTime;
      if (endTime) range.timestamp.lte = endTime;
      must.push({ range });
    }

    const result = await client.search({
      index: 'error-logs-*',
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
          },
        },
        sort: [
          {
            timestamp: {
              order: 'desc',
            },
          },
        ],
        from: (page - 1) * pageSize,
        size: pageSize,
      },
    });

    return {
      total: result.hits.total.value,
      list: result.hits.hits.map(hit => hit._source),
    };
  } catch (error) {
    console.error('[ES] Search failed:', error);
    throw error;
  }
}

/**
 * 创建索引模板
 */
async function createIndexTemplate() {
  try {
    await client.indices.putIndexTemplate({
      name: 'error-logs-template',
      body: {
        index_patterns: ['error-logs-*'],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              '@timestamp': { type: 'date' },
              timestamp: { type: 'long' },
              errorId: { type: 'keyword' },
              type: { type: 'keyword' },
              subType: { type: 'keyword' },
              message: { type: 'text' },
              stack: { type: 'text' },
              stackHash: { type: 'keyword' },
              'session.sessionId': { type: 'keyword' },
              'session.userId': { type: 'keyword' },
              'pageState.url': { type: 'keyword' },
              breadcrumbs: {
                type: 'nested',
                properties: {
                  type: { type: 'keyword' },
                  category: { type: 'keyword' },
                  message: { type: 'text' },
                  timestamp: { type: 'long' },
                },
              },
            },
          },
        },
      },
    });

    console.log('[ES] Index template created');
  } catch (error) {
    console.error('[ES] Create template failed:', error);
  }
}

/**
 * 获取日期字符串（用于索引名称）
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// 初始化时创建索引模板
createIndexTemplate();

module.exports = {
  saveToElasticsearch,
  getErrorFromES,
  getSessionFromES,
  searchErrors,
};
