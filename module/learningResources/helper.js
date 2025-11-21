/**
 * name : helper.js
 * author : Aman
 * created-date : 22-Nov-2020
 * Description : Learning resources related helper functionality
 */

/**
 * LearningResourcesHelper
 * @class
 */

module.exports = class LearningResourcesHelper {
	/**
	 * Extract learning resources from csv.
	 * @method
	 * @name extractLearningResourcesFromCsv
	 * @param {Object} parsedCsvData - Parsed csv data.
	 * @returns {Array} learning resources data.
	 */

	static extractLearningResourcesFromCsv(parsedCsvData) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log(parsedCsvData)
				let learningResources = []

				for (let resourceCount = 1; resourceCount < 50; resourceCount++) {
					let resource = 'learningResources' + resourceCount + '-'
					let resourceName = resource + 'name'
					let resourceLink = resource + 'link'
					let resourceApp = resource + 'app'
					let resourceId = resource + 'id'
					let resourceType = resource + 'type'

					let resources = {}

					if (parsedCsvData[resourceName] !== '' && parsedCsvData[resourceName] !== undefined) {
						resources['name'] = parsedCsvData[resourceName]
						delete parsedCsvData[resourceName]
					}

					if (parsedCsvData[resourceLink] !== '' && parsedCsvData[resourceLink] !== undefined) {
						resources['link'] = parsedCsvData[resourceLink]
						delete parsedCsvData[resourceLink]
					}

					if (parsedCsvData[resourceApp] !== '' && parsedCsvData[resourceApp] !== undefined) {
						resources['app'] = parsedCsvData[resourceApp]
						delete parsedCsvData[resourceApp]
					}

					if (parsedCsvData[resourceId] !== '' && parsedCsvData[resourceId] !== undefined) {
						resources['id'] = parsedCsvData[resourceId]
						delete parsedCsvData[resourceId]
					}

					if (parsedCsvData[resourceType] !== '' && parsedCsvData[resourceType] !== undefined) {
						resources['type'] = parsedCsvData[resourceType]
						delete parsedCsvData[resourceType]
					}

					if (Object.keys(resources).length > 0) {
						learningResources.push(resources)
					}
				}
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.DUPLICATE_PROJECT_TEMPLATES_CREATED,
					data: learningResources,
				})
			} catch (error) {
				return reject(error)
			}
		})
	}
}
