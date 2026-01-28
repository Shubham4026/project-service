/**
 * name : helper.js
 * author : Aman
 * created-date : 03-sep-2020
 * Description : Solution related helper functionality.
 */

const { ObjectId } = require('mongodb')

// Dependencies

const solutionsQueries = require(DB_QUERY_BASE_PATH + '/solutions')
const programsHelper = require(MODULES_BASE_PATH + '/programs/helper')
const programQueries = require(DB_QUERY_BASE_PATH + '/programs')
const validateEntity = process.env.VALIDATE_ENTITIES
const appsPortalBaseUrl = process.env.APP_PORTAL_BASE_URL + '/'
const projectQueries = require(DB_QUERY_BASE_PATH + '/projects')
const filesHelpers = require(MODULES_BASE_PATH + '/cloud-services/files/helper')
const entitiesService = require(GENERICS_FILES_PATH + '/services/entity-management')
const projectTemplateQueries = require(DB_QUERY_BASE_PATH + '/projectTemplates')
const projectTemplatesHelper = require(MODULES_BASE_PATH + '/project/templates/helper')
const programUsersHelper = require(MODULES_BASE_PATH + '/programUsers/helper')
const timeZoneDifference = process.env.TIMEZONE_DIFFRENECE_BETWEEN_LOCAL_TIME_AND_UTC

/**
 * SolutionsHelper
 * @class
 */
module.exports = class SolutionsHelper {
	/**
	 * Targeted solutions types.
	 * @method
	 * @name _targetedSolutionTypes
	 * @returns {Array} - Targeted solution types
	 */

	static _targetedSolutionTypes() {
		return [
			CONSTANTS.common.OBSERVATION,
			CONSTANTS.common.SURVEY,
			CONSTANTS.common.IMPROVEMENT_PROJECT,
			CONSTANTS.common.COURSE,
		]
	}

	/**
	 * Generate solution creation data.
	 * @method
	 * @name _createSolutionData
	 * @returns {Object} - solution creation data
	 */

	static _createSolutionData(
		name = '',
		externalId = '',
		isAPrivateProgram = '',
		status,
		description = '',
		userId,
		isReusable = '',
		parentSolutionId = '',
		type = '',
		subType = '',
		updatedBy = '',
		projectTemplateId = ''
	) {
		let solutionData = {}
		solutionData.name = name
		solutionData.externalId = externalId
		solutionData.isAPrivateProgram = isAPrivateProgram
		solutionData.status = status
		solutionData.description = description
		solutionData.author = userId
		if (parentSolutionId) {
			solutionData.parentSolutionId = parentSolutionId
		}
		if (type) {
			solutionData.type = type
		}
		if (subType) {
			solutionData.subType = subType
		}
		if (updatedBy) {
			solutionData.updatedBy = updatedBy
		}
		if (isReusable) {
			solutionData.isReusable = isReusable
		}
		if (projectTemplateId) {
			solutionData.projectTemplateId = projectTemplateId
		}

		return solutionData
	}

	/**
	 * Generate program creation data.
	 * @method
	 * @name _createProgramData
	 * @returns {Object} - program creation data
	 */

	static _createProgramData(
		name,
		externalId,
		isAPrivateProgram,
		status,
		description,
		userId,
		startDate,
		endDate,
		createdBy = ''
	) {
		let programData = {}
		programData.name = name
		programData.externalId = externalId
		programData.isAPrivateProgram = isAPrivateProgram
		programData.status = status
		programData.description = description
		programData.userId = userId
		programData.createdBy = createdBy
		programData.startDate = startDate
		programData.endDate = endDate
		return programData
	}

	/**
	 * Set scope in solution
	 * @method
	 * @name setScope
	 * @param {String} solutionId - solution id.
	 * @param {Object} scopeData - scope data.
	 * @param {String} scopeData.entityType - scope entity type
	 * @param {Array} scopeData.entities - scope entities
	 * @param {Array} scopeData.roles - roles in scope
	 * @returns {JSON} - scope in solution.
	 */

	static setScope(solutionId, scopeData) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument({ _id: solutionId }, ['_id'])

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				// let currentSolutionScope = {};
				let scopeKeys = Object.keys(scopeData).map((key) => {
					return `scope.${key}`
				})

				let solutionIndexedKeys = await solutionsQueries.listIndexes()
				let indexes = solutionIndexedKeys.map((indexedKeys) => {
					return Object.keys(indexedKeys.key)[0]
				})
				let keysNotIndexed = _.differenceWith(scopeKeys, indexes)
				// if (Object.keys(scopeData).length > 0) {
				//   if (scopeData.entityType) {
				//     let bodyData = { name: scopeData.entityType };
				//     let entityTypeData = await entityTypesHelper.list(bodyData);
				//     if (entityTypeData.length > 0) {
				//       currentSolutionScope.entityType = entityTypeData[0].name;
				//     }
				//   }

				//   if (scopeData.entities && scopeData.entities.length > 0) {
				//     //call learners api for search
				//     let entityIds = [];
				//     let locationData = gen.utils.filterLocationIdandCode(scopeData.entities);

				//     if (locationData.codes.length > 0) {
				//       let filterData = {
				//         'registryDetails.code': locationData.codes,
				//         entityType: currentSolutionScope.entityType,
				//       };
				//       let entityDetails = await entitiesHelper.entitiesDocument(filterData);

				//       if (entityDetails.success) {
				//         entityDetails.data.forEach((entity) => {
				//           entityIds.push(entity.id);
				//         });
				//       }
				//     }
				//     entityIds = [...locationData.ids, ...locationData.codes];

				//     if (!entityIds.length > 0) {
				//       return resolve({
				//         status: HTTP_STATUS_CODE.bad_request.status,
				//         message: CONSTANTS.apiResponses.ENTITIES_NOT_FOUND,
				//       });
				//     }

				//     let entitiesData = [];

				//     // if( currentSolutionScope.entityType !== programData[0].scope.entityType ) {
				//     //   let result = [];
				//     //   let childEntities = await userService.getSubEntitiesBasedOnEntityType(currentSolutionScope.entities, currentSolutionScope.entityType, result);
				//     //   if( childEntities.length > 0 ) {
				//     //     entitiesData = entityIds.filter(element => childEntities.includes(element));
				//     //   }
				//     // } else {
				//     entitiesData = entityIds;
				//     // }

				//     if (!entitiesData.length > 0) {
				//       return resolve({
				//         status: HTTP_STATUS_CODE.bad_request.status,
				//         message: CONSTANTS.apiResponses.SCOPE_ENTITY_INVALID,
				//       });
				//     }

				//     currentSolutionScope.entities = entitiesData;
				//   }

				//   // currentSolutionScope.recommendedFor = scopeData.recommendedFor;

				//   // if (scopeData.roles) {
				//   //   if (Array.isArray(scopeData.roles) && scopeData.roles.length > 0) {
				//   //     let userRoles = await userRolesHelper.list(
				//   //       {
				//   //         code: { $in: scopeData.roles },
				//   //       },
				//   //       ['_id', 'code'],
				//   //     );

				//   //     if (!userRoles.length > 0) {
				//   //       return resolve({
				//   //         status: HTTP_STATUS_CODE.bad_request.status,
				//   //         message: CONSTANTS.apiResponses.INVALID_ROLE_CODE,
				//   //       });
				//   //     }

				//   //     currentSolutionScope['roles'] = userRoles;
				//   //   } else {
				//   //     if (scopeData.roles === CONSTANTS.common.ALL_ROLES) {
				//   //       currentSolutionScope['roles'] = [
				//   //         {
				//   //           code: CONSTANTS.common.ALL_ROLES,
				//   //         },
				//   //       ];
				//   //     }
				//   //   }
				//   // }
				// }
				if (keysNotIndexed.length > 0) {
					// Map the keysNotIndexed array to get the second part after splitting by '.'
					let keysCannotBeAdded = keysNotIndexed.map((keys) => {
						return keys.split('.')[1]
					})
					scopeData = _.omit(scopeData, keysCannotBeAdded)
				}

				const updateObject = {
					$set: {},
				}

				// Assign the scopeData to the scope field in updateObject
				updateObject['$set']['scope'] = scopeData

				// Extract all keys from scopeData except 'roles', and merge their values into a single array
				const entities = Object.keys(scopeData)
					.filter((key) => key !== 'roles')
					.reduce((acc, key) => acc.concat(scopeData[key]), [])

				// Assign the entities array to the entities field in updateObject
				updateObject.$set.entities = entities

				// Create a comma-separated string of all keys in scopeData except 'roles'
				scopeData['entityType'] = Object.keys(_.omit(scopeData, ['roles'])).join(',')

				// Assign the entityType string to the entityType field in updateObject
				updateObject['$set']['entityType'] = scopeData.entityType

				// Update the solution document with the updateObject
				let updateSolution = await solutionsQueries.updateSolutionDocument(
					{
						_id: solutionId,
					},
					updateObject,
					{ new: true }
				)

				// If the update was unsuccessful, throw an error
				if (!updateSolution._id) {
					throw {
						status: CONSTANTS.apiResponses.SOLUTION_SCOPE_NOT_ADDED,
					}
				}
				solutionData = updateSolution

				// Create the result object with the updated solution ID and scope
				let result = { _id: solutionId, scope: updateSolution.scope }

				// Resolve the promise with a success message and the result object
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SOLUTION_UPDATED,
					result: result,
				})
			} catch (error) {
				return resolve({
					message: error.message,
					success: false,
				})
			}
		})
	}

	/**
	 * Create solution.
	 * @method
	 * @name createSolution
	 * @param {Object} solutionData - solution creation data.
	 * @returns {JSON} solution creation data.
	 */

	static createSolution(solutionData, checkDate = false) {
		return new Promise(async (resolve, reject) => {
			try {
				solutionData.type = solutionData.subType = CONSTANTS.common.IMPROVEMENT_PROJECT
				solutionData.resourceType = [CONSTANTS.common.RESOURCE_TYPE]
				solutionData.language = [CONSTANTS.common.ENGLISH_LANGUAGE]
				solutionData.keywords = [CONSTANTS.common.KEYWORDS]
				solutionData.isDeleted = false
				solutionData.isReusable = false

				let programData = await programQueries.programsDocument(
					{
						externalId: solutionData.programExternalId,
					},
					['name', 'description', 'scope', 'endDate', 'startDate']
				)

				if (!programData.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.PROGRAM_NOT_FOUND,
					}
				}

				solutionData.programId = programData[0]._id
				solutionData.programName = programData[0].name
				solutionData.programDescription = programData[0].description

				if (solutionData.type == CONSTANTS.common.COURSE && !solutionData.link) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.COURSE_LINK_REQUIRED,
					})
				}

				// if (solutionData.entities && solutionData.entities.length > 0) {
				// 	let entityIds = []
				// 	let locationData = UTILS.filterLocationIdandCode(solutionData.entities)

				// 	if (locationData.ids.length > 0) {
				// 		let bodyData = {
				// 			id: locationData.ids,
				// 		}
				// 		let entityData = await entitiesService.entityDocuments(bodyData, 'all')
				// 		if (entityData.success) {
				// 			entityData.data.forEach((entity) => {
				// 				entityIds.push(entity._id)
				// 			})
				// 		}
				// 	}

				// 	  if (locationData.codes.length > 0) {
				// 	    let filterData = {
				// 	      externalId: locationData.codes,
				// 	    };
				// 	    let schoolDetails = await userService.orgSchoolSearch(filterData);

				// 	    if (schoolDetails.success) {
				// 	      let schoolData = schoolDetails.data;
				// 	      schoolData.forEach((entity) => {
				// 	        entityIds.push(entity.externalId);
				// 	      });
				// 	    }
				// 	  }

				// 	  if (!entityIds.length > 0) {
				// 	    throw {
				// 	      message: CONSTANTS.apiResponses.ENTITIES_NOT_FOUND,
				// 	    };
				// 	  }

				// 	solutionData.entities = entityIds
				// }

				if (
					solutionData.minNoOfSubmissionsRequired &&
					solutionData.minNoOfSubmissionsRequired > CONSTANTS.common.DEFAULT_SUBMISSION_REQUIRED
				) {
					if (!solutionData.allowMultipleAssessemts) {
						solutionData.minNoOfSubmissionsRequired = CONSTANTS.common.DEFAULT_SUBMISSION_REQUIRED
					}
				}

				solutionData.status = CONSTANTS.common.ACTIVE_STATUS

				if (checkDate) {
					if (solutionData.hasOwnProperty('endDate')) {
						solutionData.endDate = UTILS.getEndDate(solutionData.endDate, timeZoneDifference)
						if (solutionData.endDate > programData[0].endDate) {
							solutionData.endDate = programData[0].endDate
						}
					}
					if (solutionData.hasOwnProperty('startDate')) {
						solutionData.startDate = UTILS.getStartDate(solutionData.startDate, timeZoneDifference)
						if (solutionData.startDate < programData[0].startDate) {
							solutionData.startDate = programData[0].startDate
						}
					}
				}

				solutionData['submissionLevel'] = process.env.SUBMISSION_LEVEL
				let solutionCreation = await solutionsQueries.createSolution(_.omit(solutionData, ['scope']))

				if (!solutionCreation._id) {
					throw {
						message: CONSTANTS.apiResponses.SOLUTION_NOT_CREATED,
					}
				}

				let updateProgram = await programQueries.findAndUpdate(
					{
						_id: solutionData.programId,
					},
					{
						$addToSet: { components: solutionCreation._id },
					}
				)

				if (!solutionData.excludeScope && programData[0].scope) {
					await this.setScope(solutionCreation._id, solutionData.scope ? solutionData.scope : {})
				}

				return resolve({
					message: CONSTANTS.apiResponses.SOLUTION_CREATED,
					data: {
						_id: solutionCreation._id,
					},
					result: {
						_id: solutionCreation._id,
					},
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * Update solution.
	 * @method
	 * @name update
	 * @param {String} solutionId - solution id.
	 * @param {Object} solutionData - solution creation data.
	 * @returns {JSON} solution creation data.
	 */

	static update(solutionId, solutionData, userId, checkDate = false) {
		return new Promise(async (resolve, reject) => {
			try {
				let queryObject = {
					_id: solutionId,
				}

				let solutionDocument = await solutionsQueries.solutionsDocument(queryObject, ['_id', 'programId'])

				if (!solutionDocument.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				if (
					checkDate &&
					(solutionData.hasOwnProperty(CONSTANTS.common.END_DATE) ||
						solutionData.hasOwnProperty(CONSTANTS.common.END_DATE))
				) {
					let programData = await programQueries.programsDocument(
						{
							_id: solutionDocument[0].programId,
						},
						['_id', 'endDate', 'startDate']
					)

					if (!programData.length > 0) {
						throw {
							message: CONSTANTS.apiResponses.PROGRAM_NOT_FOUND,
						}
					}
					if (solutionData.hasOwnProperty(CONSTANTS.common.END_DATE)) {
						solutionData.endDate = UTILS.getEndDate(solutionData.endDate, timeZoneDifference)
						if (solutionData.endDate > programData[0].endDate) {
							solutionData.endDate = programData[0].endDate
						}
					}
					if (solutionData.hasOwnProperty(CONSTANTS.common.START_DATE)) {
						solutionData.startDate = UTILS.getStartDate(solutionData.startDate, timeZoneDifference)
						if (solutionData.startDate < programData[0].startDate) {
							solutionData.startDate = programData[0].startDate
						}
					}
				}

				let updateObject = {
					$set: {},
				}

				if (
					solutionData.minNoOfSubmissionsRequired &&
					solutionData.minNoOfSubmissionsRequired > CONSTANTS.common.DEFAULT_SUBMISSION_REQUIRED
				) {
					if (!solutionData.allowMultipleAssessemts) {
						solutionData.minNoOfSubmissionsRequired = CONSTANTS.common.DEFAULT_SUBMISSION_REQUIRED
					}
				}

				let solutionUpdateData = solutionData

				Object.keys(_.omit(solutionUpdateData, ['scope'])).forEach((updationData) => {
					updateObject['$set'][updationData] = solutionUpdateData[updationData]
				})

				updateObject['$set']['updatedBy'] = userId
				let solutionUpdatedData = await solutionsQueries.updateSolutionDocument(
					{
						_id: solutionDocument[0]._id,
					},
					updateObject,
					{ new: true }
				)

				if (!solutionUpdatedData._id) {
					throw {
						message: CONSTANTS.apiResponses.SOLUTION_NOT_CREATED,
					}
				}

				if (solutionData.scope && Object.keys(solutionData.scope).length > 0) {
					let solutionScope = await this.setScope(solutionUpdatedData._id, solutionData.scope)

					if (!solutionScope.success) {
						throw {
							message: CONSTANTS.apiResponses.COULD_NOT_UPDATE_SCOPE,
						}
					}
				}
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SOLUTION_UPDATED,
					data: {
						_id: solutionUpdatedData._id,
					},
					result: {
						_id: solutionUpdatedData._id,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * List solutions.
	 * @method
	 * @name list
	 * @param {String} type - solution type.
	 * @param {String} subType - solution sub type.
	 * @param {Number} pageNo - page no.
	 * @param {Number} pageSize - page size.
	 * @param {String} searchText - search text.
	 * @param {Object} filter - Filtered data.
	 * @returns {JSON} List of solutions.
	 */

	static list(type, subType, filter = {}, pageNo, pageSize, searchText, projection = []) {
		return new Promise(async (resolve, reject) => {
			try {
				let matchQuery = {
					isDeleted: false,
				}
				// if (type == CONSTANTS.common.SURVEY) {
				//   matchQuery["status"] = {
				//     $in: [CONSTANTS.common.ACTIVE_STATUS, CONSTANTS.common.INACTIVE],
				//   };
				// } else {
				//   matchQuery.status = CONSTANTS.common.ACTIVE_STATUS;
				// }

				matchQuery.status = CONSTANTS.common.ACTIVE_STATUS

				if (type !== '') {
					matchQuery['type'] = type
				}

				if (subType !== '') {
					matchQuery['subType'] = subType
				}

				if (Object.keys(filter).length > 0) {
					matchQuery = _.merge(matchQuery, filter)
				}

				let searchData = [
					{
						name: new RegExp(searchText, 'i'),
					},
					{
						externalId: new RegExp(searchText, 'i'),
					},
					{
						description: new RegExp(searchText, 'i'),
					},
				]

				if (searchText !== '') {
					if (matchQuery['$or']) {
						matchQuery['$and'] = [{ $or: matchQuery.$or }, { $or: searchData }]

						delete matchQuery.$or
					} else {
						matchQuery['$or'] = searchData
					}
				}

				let projection1 = {}

				if (projection.length > 0) {
					projection.forEach((projectedData) => {
						projection1[projectedData] = 1
					})
				} else {
					projection1 = {
						description: 1,
						externalId: 1,
						name: 1,
					}
				}

				let facetQuery = {}
				facetQuery['$facet'] = {}

				facetQuery['$facet']['totalCount'] = [{ $count: 'count' }]

				// facetQuery['$facet']['data'] = [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }]
				if (pageSize === '' && pageNo === '') {
					facetQuery['$facet']['data'] = [{ $skip: 0 }]
				} else {
					facetQuery['$facet']['data'] = [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }]
				}

				let projection2 = {}

				projection2['$project'] = {
					data: 1,
					count: {
						$arrayElemAt: ['$totalCount.count', 0],
					},
				}
				let solutionDocuments = await solutionsQueries.getAggregate([
					{ $match: matchQuery },
					{
						$sort: { updatedAt: -1 },
					},
					{ $project: projection1 },
					facetQuery,
					projection2,
				])

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SOLUTIONS_LIST,
					data: solutionDocuments[0],
					result: solutionDocuments[0],
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * List of solutions based on role and location.
	 * @method
	 * @name forUserRoleAndLocation
	 * @param {String} bodyData - Requested body data.
	 * @param {String} type - solution type.
	 * @param {String} subType - solution sub type.
	 * @param {String} programId - program Id
	 * @param {String} pageSize - Page size.
	 * @param {String} pageNo - Page no.
	 * @param {String} searchText - search text.
	 * @returns {JSON} - List of solutions based on role and location.
	 */

	static forUserRoleAndLocation(bodyData, type, subType = '', programId, pageSize, pageNo, searchText = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryData = await this.queryBasedOnRoleAndLocation(bodyData, type)
				if (!queryData.success) {
					return resolve(queryData)
				}
				let matchQuery = queryData.data

				if (type === '' && subType === '') {
					let targetedTypes = this._targetedSolutionTypes()

					matchQuery['$or'] = []

					targetedTypes.forEach((type) => {
						let singleType = {}
						// if (type === CONSTANTS.common.SURVEY) {
						//   singleType = {
						//     type: type,
						//   };
						//   const currentDate = new Date();
						//   currentDate.setDate(currentDate.getDate() - 15);
						//   singleType["endDate"] = { $gte: currentDate };
						// } else {
						singleType = {
							type: type,
						}
						singleType['endDate'] = { $gte: new Date() }
						// }

						if (type === CONSTANTS.common.IMPROVEMENT_PROJECT) {
							singleType['projectTemplateId'] = { $exists: true }
						}

						matchQuery['$or'].push(singleType)
					})
				} else {
					if (type !== '') {
						matchQuery['type'] = type
						// if (type === CONSTANTS.common.SURVEY) {
						// 	const currentDate = new Date()
						// 	currentDate.setDate(currentDate.getDate() - 15)
						// 	matchQuery["endDate"] = { $gte: currentDate };
						// } else {
						// 	matchQuery["endDate"] = { $gte: new Date() };
						// }
						matchQuery['endDate'] = { $gte: new Date() }
					}

					if (subType !== '') {
						matchQuery['subType'] = subType
					}
				}

				if (programId !== '') {
					matchQuery['programId'] = ObjectId(programId)
				}

				// matchQuery["startDate"] = { $lte: new Date() };
				// for survey type solutions even after expiry it should be visible to user for 15 days
				let targetedSolutions = await this.list(type, subType, matchQuery, pageNo, pageSize, searchText, [
					'name',
					'description',
					'programName',
					'programId',
					'externalId',
					'projectTemplateId',
					'type',
					'language',
					'creator',
					'endDate',
					'link',
					'referenceFrom',
					'entityType',
					'certificateTemplateId',
					'metaInformation',
				])
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.TARGETED_SOLUTIONS_FETCHED,
					data: targetedSolutions.data,
					result: targetedSolutions.data,
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
	 * Update User District and Organisation In Solutions For Reporting.
	 * @method
	 * @name _addReportInformationInSolution
	 * @param {String} solutionId - solution id.
	 * @param {Object} userProfile - user profile details
	 * @returns {Object} Solution information.
	 */

	static addReportInformationInSolution(solutionId, userProfile) {
		return new Promise(async (resolve, reject) => {
			try {
				//check solution & userProfile is exist
				if (solutionId && userProfile && userProfile['userLocations'] && userProfile['organisations']) {
					let district = []
					let organisation = []

					//get the districts from the userProfile
					for (const location of userProfile['userLocations']) {
						if (location.type == CONSTANTS.common.DISTRICT) {
							let distData = {}
							distData['locationId'] = location.id
							distData['name'] = location.name
							district.push(distData)
						}
					}

					//get the organisations from the userProfile
					for (const org of userProfile['organisations']) {
						if (!org.isSchool) {
							let orgData = {}
							orgData.orgName = org.orgName
							orgData.organisationId = org.organisationId
							organisation.push(orgData)
						}
					}

					let updateQuery = {}
					updateQuery['$addToSet'] = {}

					if (organisation.length > 0) {
						updateQuery['$addToSet']['reportInformation.organisations'] = { $each: organisation }
					}

					if (district.length > 0) {
						updateQuery['$addToSet']['reportInformation.districts'] = { $each: district }
					}

					//add user district and organisation in solution
					if (updateQuery['$addToSet'] && Object.keys(updateQuery['$addToSet'].length > 0)) {
						await solutionsQueries.updateSolutionDocument({ _id: solutionId }, updateQuery)
					}
				} else {
					throw new Error(CONSTANTS.apiResponses.SOLUTION_ID_AND_USERPROFILE_REQUIRED)
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.UPDATED_DOCUMENT_SUCCESSFULLY,
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: [],
				})
			}
		})
	}

	/**
	 * Add roles in solution scope.
	 * @method
	 * @name addRolesInScope
	 * @param {String} solutionId - Solution Id.
	 * @param {Array} roles - roles data.
	 * @returns {JSON} - Added roles data.
	 */

	static addRolesInScope(solutionId, roles) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument(
					{
						_id: solutionId,
						scope: { $exists: true },
						isReusable: false,
						isDeleted: false,
					},
					['_id']
				)

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				let updateQuery = {}

				if (Array.isArray(roles) && roles.length > 0) {
					let currentRoles = await solutionsQueries.solutionsDocument({ _id: solutionId }, ['scope.roles'])
					currentRoles = currentRoles[0].scope.roles

					let currentRolesSet = new Set(currentRoles)
					let rolesSet = new Set(roles)

					rolesSet.forEach((role) => {
						if (role != '' && role != 'all') currentRolesSet.add(role)
					})

					currentRoles = Array.from(currentRolesSet)
					updateQuery['$set'] = {
						'scope.roles': currentRoles,
					}
				} else {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.INVALID_ROLE_CODE,
					})
				}

				let updateSolution = await solutionsQueries.updateSolutionDocument(
					{
						_id: solutionId,
					},
					updateQuery,
					{ new: true }
				)

				if (!updateSolution || !updateSolution._id) {
					throw {
						message: CONSTANTS.apiResponses.SOLUTION_NOT_UPDATED,
					}
				}

				return resolve({
					message: CONSTANTS.apiResponses.ROLES_ADDED_IN_SOLUTION,
					success: true,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Auto targeted query field.
	 * @method
	 * @name queryBasedOnRoleAndLocation
	 * @param {String} data - Requested body data.
	 * @param {String} type - solution type
	 * @param {String} prefix - prefix word/letters for query making
	 * @returns {JSON} - Auto targeted solutions query.
	 */

	static queryBasedOnRoleAndLocation(data, type = '', prefix = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let registryIds = []
				let entityTypes = []
				let filterQuery = {
					isReusable: false,
					isDeleted: false,
				}
				Object.keys(_.omit(data, ['role', 'filter', 'factors', 'type'])).forEach((key) => {
					data[key] = data[key].split(',')
				})

				// If validate entity set to ON . strict scoping should be applied
				if (validateEntity !== CONSTANTS.common.OFF) {
					Object.keys(_.omit(data, ['filter', 'role', 'factors', 'type'])).forEach((requestedDataKey) => {
						registryIds.push(...data[requestedDataKey])
						entityTypes.push(requestedDataKey)
					})
					if (!registryIds.length > 0) {
						throw {
							message: CONSTANTS.apiResponses.NO_LOCATION_ID_FOUND_IN_DATA,
						}
					}

					if (!data.role) {
						throw {
							message: CONSTANTS.apiResponses.USER_ROLES_NOT_FOUND,
						}
					}

					// If prefix is given use it to form query
					if (prefix != '') {
						filterQuery[`${prefix}.scope.roles`] = {
							$in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')],
						}
					} else {
						filterQuery['scope.roles'] = {
							$in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')],
						}
					}

					filterQuery.$or = []
					Object.keys(_.omit(data, ['filter', 'role', 'factors', 'type'])).forEach((key) => {
						// If prefix is given use it to form query
						if (prefix != '') {
							filterQuery.$or.push({
								[`${prefix}.scope.${key}`]: { $in: data[key] },
							})
						} else {
							filterQuery.$or.push({
								[`scope.${key}`]: { $in: data[key] },
							})
						}
					})

					// If prefix is given use it to form query
					if (prefix != '') {
						filterQuery[`${prefix}.scope.entityType`] = { $in: entityTypes }
					} else {
						filterQuery['scope.entityType'] = { $in: entityTypes }
					}
				} else {
					// Obtain userInfo
					let userRoleInfo = _.omit(data, ['filter', 'factors', 'role', 'type'])
					let userRoleKeys = Object.keys(userRoleInfo)
					let queryFilter = []

					// if factors are passed or query has to be build based on the keys passed
					if (data.hasOwnProperty('factors') && data.factors.length > 0) {
						let factors = data.factors
						// Build query based on each key
						factors.forEach((factor) => {
							let scope = 'scope.' + factor

							// If prefix is given use it to form query
							if (prefix != '') {
								scope = `${prefix}.scope.${factor}`
							}
							let values = userRoleInfo[factor]
							if (factor === 'role') {
								// If prefix is given use it to form query
								if (prefix != '') {
									queryFilter.push({
										[`${prefix}.scope.roles`]: {
											$in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')],
										},
									})
								} else {
									queryFilter.push({
										['scope.roles']: { $in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')] },
									})
								}
							} else if (!Array.isArray(values)) {
								queryFilter.push({ [scope]: { $in: values.split(',') } })
							} else {
								queryFilter.push({ [scope]: { $in: [...values] } })
							}
						})
						// append query filter
						filterQuery['$or'] = queryFilter
					} else {
						userRoleKeys.forEach((key) => {
							let scope = 'scope.' + key

							// If prefix is given use it to form query
							if (prefix != '') {
								scope = `${prefix}.scope.${key}`
							}
							let values = userRoleInfo[key]
							if (!Array.isArray(values)) {
								queryFilter.push({ [scope]: { $in: values.split(',') } })
							} else {
								queryFilter.push({ [scope]: { $in: [...values] } })
							}
						})

						if (data.role) {
							// If prefix is given use it to form query
							if (prefix != '') {
								queryFilter.push({
									[`${prefix}.scope.roles`]: {
										$in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')],
									},
								})
							} else {
								queryFilter.push({
									['scope.roles']: { $in: [CONSTANTS.common.ALL_ROLES, ...data.role.split(',')] },
								})
							}
						}

						// append query filter
						filterQuery['$and'] = queryFilter
					}
				}

				// if (type === CONSTANTS.common.SURVEY) {
				//   filterQuery["status"] = {
				//     $in: [CONSTANTS.common.ACTIVE_STATUS, CONSTANTS.common.INACTIVE],
				//   };
				//   let validDate = new Date();
				//   validDate.setDate(
				//     validDate.getDate() - CONSTANTS.common.DEFAULT_SURVEY_REMOVED_DAY
				//   );
				//   filterQuery["endDate"] = { $gte: validDate };
				// } else {
				//   filterQuery.status = CONSTANTS.common.ACTIVE_STATUS;
				// }

				filterQuery.status = CONSTANTS.common.ACTIVE_STATUS
				if (type != '') {
					filterQuery.type = type
				}
				if (data.filter && Object.keys(data.filter).length > 0) {
					let solutionsSkipped = []

					if (data.filter.skipSolutions) {
						data.filter.skipSolutions.forEach((solution) => {
							solutionsSkipped.push(ObjectId(solution.toString()))
						})

						data.filter['_id'] = {
							$nin: solutionsSkipped,
						}

						delete data.filter.skipSolutions
					}

					filterQuery = _.merge(filterQuery, data.filter)
				}
				return resolve({
					success: true,
					data: filterQuery,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
					data: {},
				})
			}
		})
	}

	/**
   * Verify solution id
   * @method
   * @name verifySolution
   * @param {String} solutionId - solution Id.
   * @param {String} userId - user Id.
   * @param {String} userToken - user token.
   * @param {Boolean} createProject - create project.
   * @param {Object} bodyData - Req Body.
   * @returns {Object} - Details of the solution.
   * Takes SolutionId and userRoleInformation as parameters.
   * @return {Object} - {
    "message": "Solution is not targeted to the role",
    "status": 200,
    "result": {
        "isATargetedSolution": false/true,
        "_id": "63987b5d26a3620009a1142d"
    }
  }
   */

	static isTargetedBasedOnUserProfile(solutionId = '', bodyData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				let response = {
					isATargetedSolution: false,
					_id: solutionId,
				}
				let queryData = await this.queryBasedOnRoleAndLocation(bodyData, bodyData.type)
				if (!queryData.success) {
					return resolve(queryData)
				}
				queryData.data['_id'] = solutionId
				let matchQuery = queryData.data
				let solutionData = await solutionsQueries.solutionsDocument(matchQuery, [
					'_id',
					'type',
					'programId',
					'name',
				])

				if (!Array.isArray(solutionData) || solutionData.length < 1) {
					return resolve({
						success: true,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND_OR_NOT_A_TARGETED,
						result: response,
					})
				}

				response.isATargetedSolution = true
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SOLUTION_DETAILS_VERIFIED,
					result: response,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Details of solution based on role and location.
	 * @method
	 * @name detailsBasedOnRoleAndLocation
	 * @param {String} solutionId - solution Id.
	 * @param {Object} bodyData - Requested body data.
	 * @returns {JSON} - Details of solution based on role and location.
	 */

	static detailsBasedOnRoleAndLocation(solutionId, bodyData, type = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let queryData = await this.queryBasedOnRoleAndLocation(bodyData, type)

				if (!queryData.success) {
					return resolve(queryData)
				}

				queryData.data['_id'] = solutionId

				let targetedSolutionDetails = await solutionsQueries.solutionsDocument(queryData.data, [
					'name',
					'externalId',
					'description',
					'programId',
					'programName',
					'programDescription',
					'programExternalId',
					'isAPrivateProgram',
					'projectTemplateId',
					'entityType',
					'entityTypeId',
					'language',
					'creator',
					'link',
					'certificateTemplateId',
					'endDate',
				])

				if (!targetedSolutionDetails.length > 0) {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					}
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.TARGETED_SOLUTIONS_FETCHED,
					result: targetedSolutionDetails[0],
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: {},
					status: error.status,
				})
			}
		})
	}

	/**
	 * Create user program and solution
	 * @method
	 * @name createProgramAndSolution
	 * @param {string} userId - logged in user Id.
	 * @param {object} programData - data needed for creation of program.
	 * @param {object} solutionData - data needed for creation of solution.
	 * @returns {Array} - Created user program and solution.
	 */

	static createProgramAndSolution(userId, data, userToken, createADuplicateSolution = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let userPrivateProgram = {}
				let dateFormat = UTILS.epochTime()
				let parentSolutionInformation = {}

				createADuplicateSolution = UTILS.convertStringToBoolean(createADuplicateSolution)
				//program part
				if (data.programId && data.programId !== '') {
					let filterQuery = {
						_id: data.programId,
					}

					if (createADuplicateSolution === false) {
						filterQuery.createdBy = userId
					}

					let checkforProgramExist = await programQueries.programsDocument(filterQuery, 'all', ['__v'])

					if (!checkforProgramExist.length > 0) {
						return resolve({
							status: HTTP_STATUS_CODE.bad_request.status,
							message: CONSTANTS.apiResponses.PROGRAM_NOT_FOUND,
							result: {},
						})
					}

					if (createADuplicateSolution === true) {
						let duplicateProgram = checkforProgramExist[0]
						duplicateProgram = await this._createProgramData(
							duplicateProgram.name,
							duplicateProgram.externalId
								? duplicateProgram.externalId + '-' + dateFormat
								: duplicateProgram.name + '-' + dateFormat,
							true,
							CONSTANTS.common.ACTIVE_STATUS,
							duplicateProgram.description,
							userId,
							duplicateProgram.startDate,
							duplicateProgram.endDate
						)
						// set rootorganisation from parent program
						if (checkforProgramExist[0].hasOwnProperty('rootOrganisations')) {
							duplicateProgram.rootOrganisations = checkforProgramExist[0].rootOrganisations
						}
						if (checkforProgramExist[0].hasOwnProperty('requestForPIIConsent')) {
							duplicateProgram.requestForPIIConsent = checkforProgramExist[0].requestForPIIConsent
						}
						userPrivateProgram = await programsHelper.create(
							_.omit(duplicateProgram, ['_id', 'components', 'scope'])
						)
						userPrivateProgram = userPrivateProgram.result
					} else {
						userPrivateProgram = checkforProgramExist[0]
					}
				} else {
					/* If the programId is not passed from the front end, we will enter this else block. 
          In this block, we need to provide the necessary basic details to create a new program, Including startDate and endDate.*/
					// Current date
					let startDate = new Date()
					// Add one year to the current date
					let endDate = new Date()
					endDate.setFullYear(endDate.getFullYear() + 1)
					let programData = await _createProgramData(
						data.programName,
						data.programExternalId ? data.programExternalId : data.programName + '-' + dateFormat,
						true,
						CONSTANTS.common.ACTIVE_STATUS,
						data.programDescription ? data.programDescription : data.programName,
						userId,
						startDate,
						endDate
					)

					if (data.rootOrganisations) {
						programData.rootOrganisations = data.rootOrganisations
					}
					userPrivateProgram = await programQueries.createProgram(programData)
				}

				let solutionDataToBeUpdated = {
					programId: userPrivateProgram._id,
					programExternalId: userPrivateProgram.externalId,
					programName: userPrivateProgram.name,
					programDescription: userPrivateProgram.description,
					isAPrivateProgram: userPrivateProgram.isAPrivateProgram,
				}

				//entities
				if (Array.isArray(data.entities) && data.entities && data.entities.length > 0) {
					let entitiesData = []
					let bodyData = {}

					let locationData = UTILS.filterLocationIdandCode(data.entities)

					if (locationData.ids.length > 0) {
						bodyData = {
							id: locationData.ids,
						}
						let entityData = await entitiesService.entityDocuments(bodyData, 'all')

						if (!entityData.success) {
							return resolve({
								status: HTTP_STATUS_CODE.bad_request.status,
								message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
								result: {},
							})
						}

						entityData.data.forEach((entity) => {
							entitiesData.push(entity._id)
						})

						solutionDataToBeUpdated['entityType'] = entityData.data[0].type
					}

					if (locationData.codes.length > 0) {
						let filterData = {
							'registryDetails.code': { $in: locationData.codes },
						}
						let entityDetails = await entitiesService.entityDocuments(filterData, 'all')
						if (!entityDetails.success || !entityDetails.data || !entityDetails.data.length > 0) {
							return resolve({
								status: HTTP_STATUS_CODE.bad_request.status,
								message: CONSTANTS.apiResponses.ENTITY_NOT_FOUND,
								result: {},
							})
						}
						let entityDocuments = entityDetails.data

						entityDocuments.forEach((entity) => {
							entitiesData.push(entity._id)
						})

						solutionDataToBeUpdated['entityType'] = CONSTANTS.common.SCHOOL
					}

					if (data.type && data.type !== CONSTANTS.common.IMPROVEMENT_PROJECT) {
						solutionDataToBeUpdated['entities'] = entitiesData
					}
				}

				//solution part
				let solution = ''
				if (data.solutionId && data.solutionId !== '') {
					let solutionData = await solutionsQueries.solutionsDocument(
						{
							_id: data.solutionId,
						},
						[
							'name',
							'link',
							'type',
							'subType',
							'externalId',
							'description',
							'certificateTemplateId',
							'projectTemplateId',
						]
					)

					if (!solutionData.length > 0) {
						return resolve({
							status: HTTP_STATUS_CODE.bad_request.status,
							message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
							result: {},
						})
					}

					if (createADuplicateSolution === true) {
						let duplicateSolution = solutionData[0]
						let solutionCreationData = await this._createSolutionData(
							duplicateSolution.name,
							duplicateSolution.externalId
								? duplicateSolution.externalId + '-' + dateFormat
								: duplicateSolution.name + '-' + dateFormat,
							true,
							CONSTANTS.common.ACTIVE,
							duplicateSolution.description,
							userId,
							false,
							duplicateSolution._id,
							duplicateSolution.type,
							duplicateSolution.subType,
							userId,
							duplicateSolution.projectTemplateId
						)

						_.merge(duplicateSolution, solutionCreationData)
						_.merge(duplicateSolution, solutionDataToBeUpdated)

						solution = await solutionsQueries.createSolution(_.omit(duplicateSolution, ['_id', 'link']))
						parentSolutionInformation.solutionId = duplicateSolution._id
						parentSolutionInformation.link = duplicateSolution.link
					} else {
						if (solutionData[0].isReusable === false) {
							return resolve({
								status: HTTP_STATUS_CODE.bad_request.status,
								message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
								result: {},
							})
						}

						solution = await solutionsQueries.updateSolutionDocument(
							{
								_id: solutionData[0]._id,
							},
							{
								$set: solutionDataToBeUpdated,
							},
							{
								new: true,
							}
						)
					}
				} else {
					let externalId, description
					if (data.solutionName) {
						externalId = data.solutionExternalId
							? data.solutionExternalId
							: data.solutionName + '-' + dateFormat
						description = data.solutionDescription ? data.solutionDescription : data.solutionName
					} else {
						externalId = userId + '-' + dateFormat
						description = userPrivateProgram.programDescription
					}

					let createSolutionData = await this._createSolutionData(
						data.solutionName ? data.solutionName : userPrivateProgram.programName,
						externalId,
						userPrivateProgram.isAPrivateProgram,
						CONSTANTS.common.ACTIVE_STATUS,
						description,
						userId,
						'',
						false,
						'',
						data.type ? data.type : CONSTANTS.common.ASSESSMENT,
						data.subType ? data.subType : CONSTANTS.common.INSTITUTIONAL
					)
					_.merge(solutionDataToBeUpdated, createSolutionData)
					solution = await solutionsQueries.createSolution(solutionDataToBeUpdated)
				}

				if (solution && solution._id) {
					let updatedProgram = await programQueries.findAndUpdate(
						{
							_id: userPrivateProgram._id,
						},
						{
							$addToSet: { components: ObjectId(solution._id) },
						},
						{
							new: true,
						}
					)
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.USER_PROGRAM_AND_SOLUTION_CREATED,
					result: {
						program: userPrivateProgram,
						solution: solution,
						parentSolutionInformation: parentSolutionInformation,
					},
				})
			} catch (error) {
				return reject(error)
			}
		})
	}

	/**
	 * remove roles from solution scope.
	 * @method
	 * @name removeRolesInScope
	 * @param {String} solutionId - Solution Id.
	 * @param {Array} roles - roles data.
	 * @returns {JSON} - Removed solution roles.
	 */

	static removeRolesInScope(solutionId, roles) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument(
					{
						_id: solutionId,
						scope: { $exists: true },
						isReusable: false,
						isDeleted: false,
					},
					['_id']
				)

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				if (Array.isArray(roles) && roles.length > 0) {
					let updateSolution = await solutionsQueries.updateSolutionDocument(
						{
							_id: solutionId,
						},
						{
							$pull: { 'scope.roles': { $in: roles } },
						},
						{ new: true }
					)

					if (!updateSolution || !updateSolution._id) {
						throw {
							message: CONSTANTS.apiResponses.SOLUTION_NOT_UPDATED,
						}
					}
				} else {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.INVALID_ROLE_CODE,
					})
				}

				return resolve({
					message: CONSTANTS.apiResponses.ROLES_REMOVED_IN_SOLUTION,
					success: true,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Generate sharing Link.
	 * @method
	 * @name _targetedSolutionTypes
	 * @returns {Array} - Targeted solution types
	 */

	static _generateLink(appsPortalBaseUrl, prefix, solutionLink, solutionType) {
		let link

		switch (solutionType) {
			case CONSTANTS.common.OBSERVATION:
				link = appsPortalBaseUrl + prefix + CONSTANTS.common.CREATE_OBSERVATION + solutionLink
				break
			case CONSTANTS.common.IMPROVEMENT_PROJECT:
				link = appsPortalBaseUrl + prefix + CONSTANTS.common.CREATE_PROJECT + solutionLink
				break
			default:
				link = appsPortalBaseUrl + prefix + CONSTANTS.common.CREATE_SURVEY + solutionLink
		}

		return link
	}

	/**
	 * Get link by solution id
	 * @method
	 * @name fetchLink
	 * @param {String} solutionId - solution Id.
	 * @param {String} userId - user Id.
	 * @returns {Object} - Details of the solution.
	 */

	static fetchLink(solutionId, userId) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument(
					{
						_id: solutionId,
						isReusable: false,
						isAPrivateProgram: false,
					},
					['link', 'type', 'author']
				)

				if (!Array.isArray(solutionData) || solutionData.length < 1) {
					return resolve({
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
						result: {},
					})
				}

				let prefix = CONSTANTS.common.PREFIX_FOR_SOLUTION_LINK

				let solutionLink, link

				if (!solutionData[0].link) {
					let updateLink = await UTILS.md5Hash(solutionData[0]._id + '###' + solutionData[0].author)

					let updateSolution = await this.update(solutionId, { link: updateLink }, userId)

					solutionLink = updateLink
				} else {
					solutionLink = solutionData[0].link
				}

				link = this._generateLink(appsPortalBaseUrl, prefix, solutionLink, solutionData[0].type)

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.LINK_GENERATED,
					result: link,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Verify Solution details.
	 * @method
	 * @name verifySolutionDetails
	 * @param {String} solutionId - Program Id.
	 * @returns {Object} - Details of the solution.
	 */

	static verifySolutionDetails(link = '', userId = '', userToken = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let response = {
					verified: false,
				}

				if (userToken == '') {
					throw new Error(CONSTANTS.apiResponses.REQUIRED_USER_AUTH_TOKEN)
				}

				if (userId == '') {
					throw new Error(CONSTANTS.apiResponses.USER_ID_REQUIRED_CHECK)
				}

				let solutionData = await solutionsQueries.solutionsDocument(
					{
						link: link,
						isReusable: false,
						status: {
							$ne: CONSTANTS.common.INACTIVE,
						},
					},
					['type', 'status', 'endDate']
				)

				if (!Array.isArray(solutionData) || solutionData.length < 1) {
					return resolve({
						message: CONSTANTS.apiResponses.INVALID_LINK,
						result: [],
					})
				}

				if (solutionData[0].status !== CONSTANTS.common.ACTIVE_STATUS) {
					return resolve({
						message: CONSTANTS.apiResponses.LINK_IS_EXPIRED,
						result: [],
					})
				}

				if (solutionData[0].endDate && new Date() > new Date(solutionData[0].endDate)) {
					if (solutionData[0].status === CONSTANTS.common.ACTIVE_STATUS) {
						let updateSolution = await this.update(
							solutionData[0]._id,
							{
								status: CONSTANTS.common.INACTIVE,
							},
							userId
						)
					}

					return resolve({
						message: CONSTANTS.apiResponses.LINK_IS_EXPIRED,
						result: [],
					})
				}

				response.verified = true
				return resolve({
					message: CONSTANTS.apiResponses.LINK_VERIFIED,
					result: response,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Add entities in solution.
	 * @method
	 * @name addEntitiesInScope
	 * @param {String} solutionId - solution Id.
	 * @param {Array} entities - entities data.
	 * @returns {JSON} - Added entities data.
	 */

	static addEntitiesInScope(solutionId, entities) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument(
					{
						_id: solutionId,
						scope: { $exists: true },
						isReusable: false,
						isDeleted: false,
					},
					['_id', 'programId', 'scope.entityType']
				)

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				let programData = await programQueries.programsDocument(
					{
						_id: solutionData[0].programId,
					},
					['scope.entities', 'scope.entityType']
				)

				if (!programData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.PROGRAM_NOT_FOUND,
					})
				}

				if (solutionData[0].scope.entityType !== programData[0].scope.entityType) {
					let checkEntityInParent = await entitiesService.entityDocuments(
						{
							_id: programData[0].scope.entities,
							[`groups.${solutionData[0].scope.entityType}`]: entities,
						},
						['_id']
					)
					if (!checkEntityInParent.success) {
						throw {
							message: CONSTANTS.apiResponses.ENTITY_NOT_EXISTS_IN_PARENT,
						}
					}
				}

				let entitiesData = await entitiesService.entityDocuments(
					{
						_id: { $in: entities },
						entityType: solutionData[0].scope.entityType,
					},
					['_id']
				)

				if (!entitiesData.success || !entitiesData.data.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.ENTITIES_NOT_FOUND,
					}
				}
				entitiesData = entitiesData.data
				let entityIds = []

				entitiesData.forEach((entity) => {
					entityIds.push(entity._id)
				})
				let updateObject = {
					$addToSet: {},
				}
				updateObject['$addToSet'][`scope.${solutionData[0].scope.entityType}`] = { $each: entityIds }

				let updateSolution = await solutionsQueries.updateSolutionDocument(
					{
						_id: solutionId,
					},
					updateObject,
					{ new: true }
				)

				if (!updateSolution || !updateSolution._id) {
					throw {
						message: CONSTANTS.apiResponses.SOLUTION_NOT_UPDATED,
					}
				}

				return resolve({
					message: CONSTANTS.apiResponses.ENTITIES_ADDED_IN_SOLUTION,
					success: true,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * remove entities in solution scope.
	 * @method
	 * @name removeEntitiesInScope
	 * @param {String} solutionId - Program Id.
	 * @param {Array} entities - entities.
	 * @returns {JSON} - Removed entities from solution scope.
	 */

	static removeEntitiesInScope(solutionId, entities) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument(
					{
						_id: solutionId,
						scope: { $exists: true },
						isReusable: false,
						isDeleted: false,
					},
					['_id', 'scope.entityType']
				)

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				let entitiesData = await entitiesService.entityDocuments(
					{
						_id: { $in: entities },
						entityType: solutionData[0].scope.entityType,
					},
					['_id']
				)

				if (!entitiesData.success || !entitiesData.data.length > 0) {
					throw {
						message: CONSTANTS.apiResponses.ENTITIES_NOT_FOUND,
					}
				}
				entitiesData = entitiesData.data
				let entityIds = []

				entitiesData.forEach((entity) => {
					entityIds.push(entity._id)
				})
				let updateObject = {
					$pull: {},
				}
				updateObject['$pull'][`scope.${solutionData[0].scope.entityType}`] = { $in: entityIds }
				let updateSolution = await solutionsQueries.updateSolutionDocument(
					{
						_id: solutionId,
					},
					updateObject,
					{ new: true }
				)

				if (!updateSolution || !updateSolution._id) {
					throw {
						message: CONSTANTS.apiResponses.SOLUTION_NOT_UPDATED,
					}
				}

				return resolve({
					message: CONSTANTS.apiResponses.ENTITIES_REMOVED_IN_SOLUTION,
					success: true,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Check the user is targeted.
	 * @method
	 * @name checkForTargetedSolution
	 * @param {String} link - Solution link.
	 * @returns {Object} - Details of the solution.
	 */

	static checkForTargetedSolution(link = '', bodyData = {}) {
		return new Promise(async (resolve, reject) => {
			try {
				let response = {
					isATargetedSolution: false,
					link: link,
				}

				let solutionDetails = await solutionsQueries.solutionsDocument({ link: link }, [
					'type',
					'_id',
					'programId',
					'name',
					'projectTemplateId',
					'programName',
					'status',
				])

				let queryData = await this.queryBasedOnRoleAndLocation(bodyData)
				if (!queryData.success) {
					return resolve(queryData)
				}

				queryData.data['link'] = link
				let matchQuery = queryData.data

				let solutionData = await solutionsQueries.solutionsDocument(matchQuery, [
					'_id',
					'link',
					'type',
					'programId',
					'name',
					'projectTemplateId',
				])

				if (!Array.isArray(solutionData) || solutionData.length < 1) {
					response.solutionId = solutionDetails[0]._id
					response.type = solutionDetails[0].type
					response.name = solutionDetails[0].name
					response.programId = solutionDetails[0].programId
					response.programName = solutionDetails[0].programName
					response.status = solutionDetails[0].status

					return resolve({
						success: true,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND_OR_NOT_A_TARGETED,
						result: response,
					})
				}

				response.isATargetedSolution = true
				Object.assign(response, solutionData[0])
				response.solutionId = solutionData[0]._id
				response.projectTemplateId = solutionDetails[0].projectTemplateId
					? solutionDetails[0].projectTemplateId
					: ''
				response.programName = solutionDetails[0].programName
				delete response._id

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SOLUTION_DETAILS_VERIFIED,
					result: response,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * List of created survey solutions by user.
	 * @method
	 * @name surveySolutions
	 * @param {String} userId - logged in userId
	 * @param {String} search - search key
	 * @param {String} [filter = ""] - filter text
	 * @returns {Json} - survey list.
	 */

	static surveySolutions(userId, pageNo, pageSize, search, filter = '') {
		return new Promise(async (resolve, reject) => {
			try {
				if (userId == '') {
					throw new Error(CONSTANTS.apiResponses.USER_ID_REQUIRED_CHECK)
				}

				let solutionMatchQuery = {
					$match: {
						author: userId,
						type: CONSTANTS.common.SURVEY,
						isReusable: false,
						isDeleted: false,
					},
				}

				if (search !== '') {
					solutionMatchQuery['$match']['$or'] = [
						{ name: new RegExp(search, 'i') },
						{ description: new RegExp(search, 'i') },
					]
				}

				if (filter && filter !== '') {
					if (filter === CONSTANTS.common.CREATED_BY_ME) {
						solutionMatchQuery['$match']['isAPrivateProgram'] = {
							$ne: false,
						}
					} else if (filter === CONSTANTS.common.ASSIGN_TO_ME) {
						solutionMatchQuery['$match']['isAPrivateProgram'] = false
					}
				}

				let result = await solutionsQueries.getAggregate([
					solutionMatchQuery,
					{
						$project: {
							solutionId: '$_id',
							name: 1,
							description: 1,
							status: 1,
							_id: 0,
						},
					},
					{
						$facet: {
							totalCount: [{ $count: 'count' }],
							data: [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }],
						},
					},
					{
						$project: {
							data: 1,
							count: {
								$arrayElemAt: ['$totalCount.count', 0],
							},
						},
					},
				])

				return resolve({
					success: true,
					data: {
						data: result[0].data,
						count: result[0].count ? result[0].count : 0,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: false,
				})
			}
		})
	}

	/**
	 * List of surveys for user.
	 * @method
	 * @name surveyList
	 * @param {String} userId - logged in userId
	 * @param {String} pageNo - page number
	 * @param {String} pageSize - page size.
	 * @param {String} filter - filter text.
	 * @returns {Json} - survey list.
	 */

	static surveyList(userId = '', pageNo, pageSize, search, filter, surveyReportPage = '') {
		return new Promise(async (resolve, reject) => {
			try {
				if (userId == '') {
					throw new Error(CONSTANTS.apiResponses.USER_ID_REQUIRED_CHECK)
				}

				let result = {
					data: [],
					count: 0,
				}

				let submissionMatchQuery = { $match: { createdBy: userId } }

				if (UTILS.convertStringToBoolean(surveyReportPage)) {
					submissionMatchQuery['$match']['status'] = CONSTANTS.common.SUBMISSION_STATUS_COMPLETED
				}

				if (search !== '') {
					submissionMatchQuery['$match']['$or'] = [
						{ 'surveyInformation.name': new RegExp(search, 'i') },
						{ 'surveyInformation.description': new RegExp(search, 'i') },
					]
				}

				if (filter && filter !== '') {
					if (filter === CONSTANTS.common.CREATED_BY_ME) {
						matchQuery['$match']['isAPrivateProgram'] = {
							$ne: false,
						}
					} else if (filter === CONSTANTS.common.ASSIGN_TO_ME) {
						matchQuery['$match']['isAPrivateProgram'] = false
					}
				}

				let surveySubmissions = await database.models.surveySubmissions.aggregate([
					submissionMatchQuery,
					{
						$project: {
							submissionId: '$_id',
							surveyId: 1,
							solutionId: 1,
							'surveyInformation.name': 1,
							'surveyInformation.endDate': 1,
							'surveyInformation.description': 1,
							status: 1,
							_id: 0,
						},
					},
					{
						$facet: {
							totalCount: [{ $count: 'count' }],
							data: [{ $skip: pageSize * (pageNo - 1) }, { $limit: pageSize }],
						},
					},
					{
						$project: {
							data: 1,
							count: {
								$arrayElemAt: ['$totalCount.count', 0],
							},
						},
					},
				])

				if (surveySubmissions[0].data && surveySubmissions[0].data.length > 0) {
					surveySubmissions[0].data.forEach(async (surveySubmission) => {
						let submissionStatus = surveySubmission.status

						if (surveyReportPage === '') {
							if (new Date() > new Date(surveySubmission.surveyInformation.endDate)) {
								surveySubmission.status = CONSTANTS.common.EXPIRED
							}
						}

						surveySubmission.name = surveySubmission.surveyInformation.name
						surveySubmission.description = surveySubmission.surveyInformation.description
						surveySubmission._id = surveySubmission.surveyId
						delete surveySubmission.surveyId
						delete surveySubmission['surveyInformation']

						if (!surveyReportPage) {
							if (submissionStatus === CONSTANTS.common.SUBMISSION_STATUS_COMPLETED) {
								result.data.push(surveySubmission)
							} else {
								if (surveySubmission.status !== CONSTANTS.common.EXPIRED) {
									result.data.push(surveySubmission)
								}
							}
						} else {
							result.data.push(surveySubmission)
						}
					})
					result.count = surveySubmissions[0].count ? result.count + surveySubmissions[0].count : result.count
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.SURVEYS_FETCHED,
					data: {
						data: result.data,
						count: result.count,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: false,
				})
			}
		})
	}

	/**
	 * List of user assigned surveys.
	 * @method
	 * @name userAssigned
	 * @param {String} userId - Logged in user Id.
	 * @param {String} pageSize - size of page.
	 * @param {String} pageNo - page number.
	 * @param {String} search - search text.
	 * @param {String} filter - filter text.
	 * @returns {Object}
	 */

	static assignedSurveys(userId, pageSize, pageNo, search = '', filter, surveyReportPage = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let surveySolutions = {
					success: false,
				}

				if (surveyReportPage === '' || UTILS.convertStringToBoolean(surveyReportPage)) {
					surveySolutions = await this.surveySolutions(userId, pageNo, pageSize, search, filter)
				}

				let totalCount = 0
				let mergedData = []

				if (surveySolutions.success && surveySolutions.data) {
					totalCount = surveySolutions.data.count
					mergedData = surveySolutions.data.data

					if (mergedData.length > 0) {
						mergedData.forEach((surveyData) => {
							surveyData.isCreator = true
						})
					}
				}

				// let surveySubmissions = await this.surveyList
				// (
				//     userId,
				//     pageNo,
				//     pageSize,
				//     search,
				//     filter,
				//     surveyReportPage
				// )

				// if( surveySubmissions.success && surveySubmissions.data.data.length > 0 ) {

				//     totalCount += surveySubmissions.data.count;

				//     surveySubmissions.data.data.forEach( surveyData => {
				//         surveyData.isCreator = false;
				//     });

				//     mergedData = [...mergedData, ...surveySubmissions.data.data];
				// }

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.USER_ASSIGNED_SURVEY_FETCHED,
					data: {
						data: mergedData,
						count: totalCount,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: [],
				})
			}
		})
	}

	/**
	 * List of library projects.
	 * @method
	 * @name projects
	 * @param pageSize - Size of page.
	 * @param pageNo - Recent page no.
	 * @param search - search text.
	 * @param fieldsArray - array of projections fields.
	 * @param groupBy - groupBy query.
	 * @returns {Object} List of library projects.
	 */

	static projects(query, searchQuery, fieldsArray, pageNo, pageSize, groupBy = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let matchQuery = {
					$match: query,
				}

				if (searchQuery && searchQuery.length > 0) {
					matchQuery['$match'] = {
						$and: [
							matchQuery['$match'], // Ensure the filter is respected
							{ $or: searchQuery }, // Then apply the search conditions
						],
					}
				}

				let projection = {}
				fieldsArray.forEach((field) => {
					projection[field] = 1
				})

				let aggregateData = []
				aggregateData.push(matchQuery)
				aggregateData.push({
					$sort: { syncedAt: -1 },
				})

				if (groupBy !== '') {
					aggregateData.push({
						$group: groupBy,
					})
				} else {
					aggregateData.push({
						$project: projection,
					})
				}

				aggregateData.push(
					{
						$facet: {
							totalCount: [{ $count: 'count' }],
							data: [
								{
									$skip:
										(pageSize == '' ? CONSTANTS.common.DEFAULT_PAGE_SIZE : pageSize) *
										((pageNo == '' ? CONSTANTS.common.DEFAULT_PAGE_NO : pageNo) - 1),
								},
								{ $limit: pageSize == '' ? CONSTANTS.common.DEFAULT_PAGE_SIZE : pageSize },
							],
						},
					},
					{
						$project: {
							data: 1,
							count: {
								$arrayElemAt: ['$totalCount.count', 0],
							},
						},
					}
				)

				let result = await projectQueries.getAggregate(aggregateData)
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.PROJECTS_FETCHED,
					data: {
						data: result[0].data,
						count: result[0].count ? result[0].count : 0,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					data: {
						data: [],
						count: 0,
					},
				})
			}
		})
	}

	/**
	 * Get Downloadable URL from cloud.
	 * @method
	 * @name getDownloadableUrl
	 * @param {Array} payloadData       - payload for files data.
	 * @returns {JSON}                  - Response with status and message.
	 */

	static getDownloadableUrl(payloadData) {
		return new Promise(async (resolve, reject) => {
			try {
				let downloadableUrl = await filesHelpers.getDownloadableUrl(payloadData)
				if (!downloadableUrl || !downloadableUrl.result || !downloadableUrl.result.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.FAILED_TO_CREATE_DOWNLOADABLEURL,
						result: {},
					})
				}

				return resolve({
					message: CONSTANTS.apiResponses.CLOUD_SERVICE_SUCCESS_MESSAGE,
					result: downloadableUrl.result,
				})
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,

					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,

					errorObject: error,
				})
			}
		})
	}

	/**
	 * Get list of user projects with the targetted ones.
	 * @method
	 * @name userAssigned
	 * @param {String} userId - Logged in user id.
	 * @param {Number} pageSize - Page size.
	 * @param {Number} pageNo - Page No.
	 * @param {String} search - Search text.
	 * @param {String} filter - filter text.
	 * @param {Object} bodyData - request body data
	 * @returns {Object}
	 */

	static assignedProjects(userId, search, filter, pageNo, pageSize, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				let searchQuery = []
				let query

				if (search !== '') {
					searchQuery = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }]
				}

				let requestedData = _.cloneDeep(bodyData)
				let generateAssignedProjectsQueryData = await this.generateAssignedProjectsQuery(
					userId,
					requestedData,
					filter
				)
				if (generateAssignedProjectsQueryData.success) {
					query = generateAssignedProjectsQueryData.data
				} else {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
					}
				}
				let projects = await this.projects(
					query,
					searchQuery,
					[
						'name',
						'title',
						'description',
						'solutionId',
						'programId',
						'programInformation.name',
						'projectTemplateId',
						'solutionExternalId',
						'lastDownloadedAt',
						'hasAcceptedTAndC',
						'referenceFrom',
						'status',
						'certificate',
					],
					pageNo,
					pageSize
				)

				let totalCount = 0
				let data = []
				if (
					projects.success &&
					projects.data &&
					projects.data.data &&
					Object.keys(projects.data.data).length > 0
				) {
					totalCount = projects.data.count
					data = projects.data.data

					if (data.length > 0) {
						let templateFilePath = []
						data.forEach((projectData) => {
							projectData.name = projectData.title

							if (projectData.programInformation) {
								projectData.programName = projectData.programInformation.name
								delete projectData.programInformation
							}

							if (projectData.solutionExternalId) {
								projectData.externalId = projectData.solutionExternalId
								delete projectData.solutionExternalId
							}

							projectData.type = CONSTANTS.common.IMPROVEMENT_PROJECT
							delete projectData.title

							if (
								projectData.certificate &&
								projectData.certificate.transactionId &&
								projectData.certificate.transactionId !== '' &&
								projectData.certificate.templateUrl &&
								projectData.certificate.templateUrl !== ''
							) {
								templateFilePath.push(projectData.certificate.templateUrl)
							}
						})
						if (templateFilePath.length > 0) {
							let certificateTemplateDownloadableUrl = await this.getDownloadableUrl(templateFilePath)
							if (
								!certificateTemplateDownloadableUrl ||
								!certificateTemplateDownloadableUrl.result ||
								!certificateTemplateDownloadableUrl.result.length > 0
							) {
								throw {
									message: CONSTANTS.apiResponses.DOWNLOADABLE_URL_NOT_FOUND,
								}
							}
							// map downloadable templateUrl to corresponding project data
							data.forEach((projectData) => {
								if (projectData.certificate) {
									var itemFromUrlArray = certificateTemplateDownloadableUrl.result.find(
										(item) => item['filePath'] == projectData.certificate.templateUrl
									)
									if (itemFromUrlArray) {
										projectData.certificate.templateUrl = itemFromUrlArray.url
									}
								}
							})
						}
					}
				}

				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.USER_ASSIGNED_PROJECT_FETCHED,
					data: {
						data: data,
						count: totalCount,
					},
				})
			} catch (error) {
				return resolve({
					success: false,
					message: error.message,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					data: {
						description: CONSTANTS.common.PROJECT_DESCRIPTION,
						data: [],
						count: 0,
					},
				})
			}
		})
	}

	/**
	 * Solution details.
	 * @method
	 * @name assignedUserSolutions
	 * @param {String} solutionType - solution type.
	 * @param {String} userId - user id
	 * @param {String} search - search.
	 * @param {String} filter - filter text
	 * @param {Number} pageNo - page number
	 * @param {Number} pageSize - page limit
	 * @param {Object} bodyData - request body data
	 * @returns {Object} - Details of the solution.
	 */

	static assignedUserSolutions(solutionType, userId, search, filter, pageNo, pageSize, bodyData) {
		return new Promise(async (resolve, reject) => {
			try {
				let userAssignedSolutions = {}
				if (solutionType === CONSTANTS.common.IMPROVEMENT_PROJECT) {
					userAssignedSolutions = await this.assignedProjects(
						userId,
						search,
						filter,
						pageNo,
						pageSize,
						bodyData
					)
				} else {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_TYPE_MIS_MATCH,
					}
				}

				return resolve(userAssignedSolutions)
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * List of solutions and targeted ones.
	 * @method
	 * @name targetedSolutions
	 * @param {Object} requestedData - Request body.
	 * @param {String} solutionType - solution type
	 * @param {String} userId - user id
	 * @param {Number} pageSize - Number of solutions to display per page.
	 * @param {Number} pageNo - The page number to retrieve.
	 * @param {String} search - Search term to filter solutions by title or description.
	 * @param {String} filter - Filter criteria to further refine the solution search.
	 * @param {Boolean} currentScopeOnly - If true, limits results to the current scope only. Default: false.
	 * @returns {Object} - Details of the solution.
	 */

	static targetedSolutions(
		requestedData,
		solutionType,
		userId,
		pageSize,
		pageNo,
		search = '',
		filter,
		surveyReportPage = '',
		currentScopeOnly = false
	) {
		return new Promise(async (resolve, reject) => {
			try {
				currentScopeOnly = UTILS.convertStringToBoolean(currentScopeOnly)
				let totalCount = 0
				let mergedData = []
				let solutionIds = []
				requestedData['filter'] = {}
				let getTargetedSolution = true
				let targetedSolutions = {
					success: false,
				}

				let filteredTargetedSolutions = []

				if (filter && filter !== '') {
					if (filter === CONSTANTS.common.CREATED_BY_ME) {
						requestedData['filter']['isAPrivateProgram'] = {
							$ne: false,
						}
					} else if (filter === CONSTANTS.common.ASSIGN_TO_ME) {
						requestedData['filter']['isAPrivateProgram'] = false
					}
				}

				if (filter === CONSTANTS.common.DISCOVERED_BY_ME) {
					getTargetedSolution = false
				}

				let copiedRequestedData = _.cloneDeep(requestedData)

				// Fetch all the targeted solutions
				if (getTargetedSolution) {
					targetedSolutions = await this.forUserRoleAndLocation(
						copiedRequestedData,
						solutionType,
						'',
						'',
						'',
						'',
						search
					)
				}

				// fetch projects created by the user
				// When currentScopeOnly is true, fetch ALL user projects to ensure proper matching
				let userCreatedProjects = await this.assignedUserSolutions(
					solutionType,
					userId,
					search,
					filter,
					currentScopeOnly ? 1 : '', // pageNo
					currentScopeOnly ? 10000 : '', // pageSize - fetch all when currentScopeOnly
					requestedData
				)
				if (!userCreatedProjects.success) {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: userCreatedProjects.message,
					}
				}

				if (process.env.SUBMISSION_LEVEL == 'ENTITY' && requestedData.hasOwnProperty('entityId')) {
					mergedData = userCreatedProjects.data.data
					totalCount = mergedData.length
					if (mergedData.length > 0) {
						let startIndex = pageSize * (pageNo - 1)
						let endIndex = startIndex + pageSize
						mergedData = mergedData.slice(startIndex, endIndex)
					}
					return resolve({
						success: true,
						message: CONSTANTS.apiResponses.TARGETED_SOLUTIONS_FETCHED,
						data: {
							data: mergedData,
							count: totalCount,
						},
						result: {
							data: mergedData,
							count: totalCount,
						},
					})
				}
				// Add program data to the fetched projects
				if (userCreatedProjects.success && userCreatedProjects.data) {
					totalCount = userCreatedProjects.data.count
					mergedData = userCreatedProjects.data.data

					if (mergedData.length > 0) {
						let programIds = []

						mergedData.forEach((mergeSolutionData) => {
							if (mergeSolutionData.solutionId) {
								solutionIds.push(mergeSolutionData.solutionId)
							}

							if (mergeSolutionData.programId) {
								programIds.push(mergeSolutionData.programId)
							}
						})

						let programsData = await programQueries.programsDocument(
							{
								_id: { $in: programIds },
							},
							['name']
						)

						if (programsData.length > 0) {
							let programs = programsData.reduce(
								(ac, program) => ({ ...ac, [program._id.toString()]: program }),
								{}
							)

							mergedData = mergedData.map((data) => {
								if (data.programId && programs[data.programId.toString()]) {
									data.programName = programs[data.programId.toString()].name
								}
								return data
							})
						}
					}
				}

				if (targetedSolutions.success) {
					// When targetedSolutions is empty and currentScopeOnly is set to true send empty response
					if (!(targetedSolutions.data.data.length > 0) && currentScopeOnly) {
						return resolve({
							success: true,
							message: CONSTANTS.apiResponses.TARGETED_SOLUTIONS_FETCHED,
							data: {
								data: targetedSolutions.data.data,
								count: targetedSolutions.data.data.length,
							},
							result: {
								data: targetedSolutions.data.data,
								count: targetedSolutions.data.data.length,
							},
						})
					}
					// When targetedSolutions is not empty alter the response based on the value of currentScopeOnly
					if (targetedSolutions.data.data && targetedSolutions.data.data.length > 0) {
						targetedSolutions.data.data.forEach((solution) => {
							let newEntry = Object.assign(
								{
									_id: '',
									solutionId: solution._id,
									creator: solution.creator || '',
									solutionMetaInformation: solution.metaInformation || {},
								},
								_.pick(solution, [
									'type',
									'externalId',
									'projectTemplateId',
									'certificateTemplateId',
									'programId',
									'programName',
									'name',
									'description',
								])
							)
							filteredTargetedSolutions.push(newEntry)
						})
						if (currentScopeOnly) {
							filteredTargetedSolutions.forEach((solution) => {
								// Find the corresponding project in mergedData where solutionId matches _id
								const matchingProject = _.find(mergedData, (project) => {
									return String(project.solutionId) === String(solution.solutionId)
								})

								if (matchingProject) {
									// Add all keys from the matching project to the solution object
									Object.assign(solution, matchingProject)
								}
							})
							mergedData = filteredTargetedSolutions
							totalCount = mergedData.length
						} else {
							filteredTargetedSolutions.forEach((solution) => {
								// Check if the solution _id exists in mergedData solutionId
								const existsInMergedData = _.some(mergedData, (project) => {
									return String(project.solutionId) === String(solution.solutionId)
								})

								if (!existsInMergedData) {
									mergedData.push(solution)
								}
							})

							totalCount = mergedData.length
						}
					}
				}

				if (mergedData.length > 0) {
					let startIndex = pageSize * (pageNo - 1)
					let endIndex = startIndex + pageSize
					mergedData = mergedData.slice(startIndex, endIndex)
				}
				return resolve({
					success: true,
					message: CONSTANTS.apiResponses.TARGETED_SOLUTIONS_FETCHED,
					data: {
						data: mergedData,
						count: totalCount,
					},
					result: {
						data: mergedData,
						count: totalCount,
					},
				})
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,
					errorObject: error,
				})
			}
		})
	}

	/**
	 * privateProgramAndSolutionDetails
	 * @method
	 * @name PrivateProgramAndSolutionDetails
	 * @param {Object} solutionData - solution data.
	 * @param {String} userId - user Id.
	 * @param {String} userToken - user token.
	 * @returns {Object} - Details of the private solution.
	 */

	static privateProgramAndSolutionDetails(solutionData, userId = '', userToken) {
		return new Promise(async (resolve, reject) => {
			try {
				// Check if a private program and private solution already exist or not for this user.
				let privateSolutionDetails = await solutionsQueries.solutionsDocument(
					{
						parentSolutionId: solutionData.solutionId,
						author: userId,
						type: solutionData.type,
						isAPrivateProgram: true,
					},
					['_id', 'programId', 'programName']
				)

				if (!privateSolutionDetails.length > 0) {
					// Data for program and solution creation
					let programAndSolutionData = {
						type: CONSTANTS.common.IMPROVEMENT_PROJECT,
						subType: CONSTANTS.common.IMPROVEMENT_PROJECT,
						isReusable: false,
						solutionId: solutionData.solutionId,
					}

					if (solutionData.programId && solutionData.programId !== '') {
						programAndSolutionData['programId'] = solutionData.programId
						programAndSolutionData['programName'] = solutionData.programName
					}
					// create private program and solution
					let solutionAndProgramCreation = await this.createProgramAndSolution(
						userId,
						programAndSolutionData,
						userToken,
						true // create duplicate solution
					)

					if (!solutionAndProgramCreation.success) {
						throw {
							status: HTTP_STATUS_CODE.bad_request.status,
							message: CONSTANTS.apiResponses.SOLUTION_PROGRAMS_NOT_CREATED,
						}
					}
					return resolve({
						success: true,
						result: solutionAndProgramCreation.result.solution._id,
					})
				} else {
					return resolve({
						success: true,
						result: privateSolutionDetails[0]._id,
					})
				}
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Verify solution link
	 * @method
	 * @name verifyLink
	 * @param {String} solutionId - solution Id.
	 * @param {String} userId - user Id.
	 * @param {String} userToken - user token.
	 * @param {Boolean} createProject - create project.
	 * @param {Object} bodyData - Req Body.
	 * @param {Object} createPrivateSolutionIfNotTargeted - flag to create private program if user is non targeted
	 * @returns {Object} - Details of the solution.
	 */

	static verifyLink(link = '', bodyData = {}, userId = '', userToken = '', createProject = true) {
		return new Promise(async (resolve, reject) => {
			try {
				let verifySolution = await this.verifySolutionDetails(link, userId, userToken)
				let checkForTargetedSolution = await this.checkForTargetedSolution(link, bodyData)
				if (!checkForTargetedSolution || Object.keys(checkForTargetedSolution.result).length <= 0) {
					return resolve(checkForTargetedSolution)
				}

				let solutionData = checkForTargetedSolution.result
				let isSolutionActive = solutionData.status === CONSTANTS.common.INACTIVE ? false : true
				// if (solutionData.type == CONSTANTS.common.OBSERVATION) {
				// Targeted solution
				// if (checkForTargetedSolution.result.isATargetedSolution) {
				//   let observationDetailFromLink =
				//     await entitiesHelper.details(
				//       userToken,
				//       solutionData.solutionId
				//     );

				//   if (observationDetailFromLink.success) {
				//     checkForTargetedSolution.result["observationId"] =
				//       observationDetailFromLink.result._id != ""
				//         ? observationDetailFromLink.result._id
				//         : "";
				//   } else if (!isSolutionActive) {
				//     throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED);
				//   }
				// } else {
				//   if (!isSolutionActive) {
				//     throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED);
				//   }
				// }
				// } else if (solutionData.type === CONSTANTS.common.SURVEY) {
				// Get survey submissions of user
				/**
           * function userServeySubmission 
           * Request:
           * @query :SolutionId -> solutionId
           * @param {userToken} for UserId
           * @response Array of survey submissions
           * example: {
            "success":true,
            "message":"Survey submission fetched successfully",
            "data":[
                {
                    "_id":"62e228eedd8c6d0009da5084",
                    "solutionId":"627dfc6509446e00072ccf78",
                    "surveyId":"62e228eedd8c6d0009da507d",
                    "status":"completed",
                    "surveyInformation":{
                        "name":"Create a Survey (To check collated reports) for 4.9 regression -- FD 380",
                        "description":"Create a Survey (To check collated reports) for 4.9 regression -- FD 380"
                    }
                }
            ]
          }       
           */
				// let surveySubmissionDetails =
				//   await surveyService.userSurveySubmissions(
				//     userToken,
				//     solutionData.solutionId
				//   );
				// let surveySubmissionData = surveySubmissionDetails.result;
				// if (surveySubmissionData.length > 0) {
				//   checkForTargetedSolution.result.submissionId =
				//     surveySubmissionData[0]._id ? surveySubmissionData[0]._id : "";
				//   checkForTargetedSolution.result.surveyId = surveySubmissionData[0]
				//     .surveyId
				//     ? surveySubmissionData[0].surveyId
				//     : "";
				//   checkForTargetedSolution.result.submissionStatus =
				//     surveySubmissionData[0].status;
				// } else if (!isSolutionActive) {
				//   throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED);
				// }
				// } else
				if (solutionData.type === CONSTANTS.common.IMPROVEMENT_PROJECT) {
					// Targeted solution

					if (checkForTargetedSolution.result.isATargetedSolution && createProject) {
						//targeted user with project creation

						let projectDetailFromLink = await projectQueries.projectDocument({
							solutionId: solutionData.solutionId,
						})

						if (!projectDetailFromLink || !projectDetailFromLink.length > 0) {
							throw new Error(CONSTANTS.apiResponses.PROJECT_NOT_FOUND)
						}

						if (projectDetailFromLink.length < 1 && !isSolutionActive) {
							throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED)
						}

						checkForTargetedSolution.result['projectId'] = projectDetailFromLink[0]._id
							? projectDetailFromLink[0]._id
							: ''
					} else if (checkForTargetedSolution.result.isATargetedSolution && !createProject) {
						//targeted user with no project creation
						let findQuery = {
							userId: userId,
							projectTemplateId: solutionData.projectTemplateId,
							referenceFrom: {
								$ne: CONSTANTS.common.LINK,
							},
							isDeleted: false,
						}

						let checkTargetedProjectExist = await projectQueries.projectDocument(findQuery, ['_id'])

						if (
							checkTargetedProjectExist &&
							checkTargetedProjectExist.length > 0 &&
							checkTargetedProjectExist[0]._id != ''
						) {
							checkForTargetedSolution.result['projectId'] = checkTargetedProjectExist[0]._id
						} else if (!isSolutionActive) {
							throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED)
						}
					} else {
						if (!isSolutionActive) {
							throw new Error(CONSTANTS.apiResponses.LINK_IS_EXPIRED)
						}

						// check if private-Project already exists
						let checkIfUserProjectExistsQuery = {
							createdBy: userId,
							referenceFrom: CONSTANTS.common.LINK,
							link: link,
						}
						let checkForProjectExist = await projectQueries.projectDocument(checkIfUserProjectExistsQuery, [
							'_id',
						])
						if (
							checkForProjectExist &&
							checkForProjectExist.length > 0 &&
							checkForProjectExist[0]._id != ''
						) {
							checkForTargetedSolution.result['projectId'] = checkForProjectExist[0]._id
						}
						// If project not found and createPrivateSolutionIfNotTargeted := true
						// By default will be false for old version of app
						if (
							!checkForTargetedSolution.result['projectId'] ||
							checkForTargetedSolution.result['projectId'] === ''
						) {
							// user is not targeted and privateSolutionCreation required
							/**
							 * function privateProgramAndSolutionDetails
							 * Request:
							 * @param {solutionData} solution data
							 * @param {userToken} for UserId
							 * @response private solutionId
							 */
							let privateProgramAndSolutionDetails = await this.privateProgramAndSolutionDetails(
								solutionData,
								userId,
								userToken
							)
							if (!privateProgramAndSolutionDetails.success) {
								throw {
									status: HTTP_STATUS_CODE.bad_request.status,
									message: CONSTANTS.apiResponses.SOLUTION_PROGRAMS_NOT_CREATED,
								}
							}
							// Replace public solutionId with private solutionId.
							if (privateProgramAndSolutionDetails.result != '') {
								checkForTargetedSolution.result['solutionId'] = privateProgramAndSolutionDetails.result
							}
						}
					}
				} else {
					throw {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_TYPE_MIS_MATCH,
					}
				}

				delete checkForTargetedSolution.result['status']

				return resolve(checkForTargetedSolution)
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Solution details.
	 * @method
	 * @name details
	 * @param {String} solutionId - Solution Id.
	 * @returns {Object} - Details of the solution.
	 */

	static getDetails(solutionId) {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument({
					_id: solutionId,
					isDeleted: false,
				})

				if (!solutionData.length > 0) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
					})
				}

				return resolve({
					message: CONSTANTS.apiResponses.SOLUTION_DETAILS_FETCHED,
					success: true,
					data: solutionData[0],
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Fetch template observation based on solution Id.
	 * @method
	 * @name details
	 * @param {String} solutionId - Solution Id.
	 * @param {Object} bodyData - Body data.
	 * @param {String} userId - User Id.
	 * @returns {Object} - Details of the solution.
	 */

	static details(solutionId, bodyData = {}, userId = '') {
		return new Promise(async (resolve, reject) => {
			try {
				let solutionData = await solutionsQueries.solutionsDocument({ _id: solutionId }, [
					'type',
					'projectTemplateId',
					'programId',
				])

				if (!Array.isArray(solutionData) || solutionData.length < 1) {
					return resolve({
						message: CONSTANTS.apiResponses.SOLUTION_NOT_FOUND,
						result: [],
					})
				}

				solutionData = solutionData[0]
				let templateOrQuestionDetails
				//this will get wether user is targeted to the solution or not based on user Role Information
				const isSolutionTargeted = await this.isTargetedBasedOnUserProfile(solutionId, bodyData)

				if (solutionData.type === CONSTANTS.common.IMPROVEMENT_PROJECT) {
					if (!solutionData.projectTemplateId) {
						throw {
							message: CONSTANTS.apiResponses.PROJECT_TEMPLATE_ID_NOT_FOUND,
						}
					}
					templateOrQuestionDetails = await projectTemplatesHelper.details(
						solutionData.projectTemplateId,
						'',
						userId,
						isSolutionTargeted.result.isATargetedSolution ? false : true
					)
				} else {
					templateOrQuestionDetails = {
						status: HTTP_STATUS_CODE.bad_request.status,
						message: CONSTANTS.apiResponses.SOLUTION_TYPE_INVALID,
						result: {},
					}
				}

				// remove certificate related details if solution not targeted to user
				if (isSolutionTargeted.result.isATargetedSolution === false) {
					delete templateOrQuestionDetails.data.criteria
					delete templateOrQuestionDetails.data.certificateTemplateId
				}

				// commented for drop 1 of elevate-project
				// if (solutionData.programId) {
				// 	// add ["rootOrganisations","requestForPIIConsent","programJoined"] values to response. Based on these values front end calls PII consent
				// 	let programData = await programQueries.programsDocument(
				// 		{
				// 			_id: solutionData.programId,
				// 		},
				// 		['rootOrganisations', 'requestForPIIConsent', 'name']
				// 	)
				// 	programData = programData[0]
				// 	templateOrQuestionDetails.data.rootOrganisations = programData.rootOrganisations
				// 		? programData.rootOrganisations
				// 		: ''
				// 	if (programData.hasOwnProperty('requestForPIIConsent')) {
				// 		templateOrQuestionDetails.data.requestForPIIConsent = programData.requestForPIIConsent
				// 	}
				// 	// We are passing programId and programName with the response because front end require these values to show program join pop-up in case of survey link flow
				// 	// In 6.0.0 release these values only used for solutions of  type survey in front-end side. But Backend is not adding any restrictions based on solution type.
				// 	// If solution have programId then we will pass below values with the response, irrespective of solution type
				// 	templateOrQuestionDetails.data.programId = solutionData.programId
				// 	templateOrQuestionDetails.data.programName = programData.name
				// }

				// //Check data present in programUsers collection.
				// //checkForUserJoinedProgramAndConsentShared will returns an object which contain joinProgram and consentShared status
				// let programJoinStatus = await programUsersHelper.checkForUserJoinedProgramAndConsentShared(
				// 	solutionData.programId,
				// 	userId
				// )
				// templateOrQuestionDetails.data.programJoined = programJoinStatus.joinProgram
				// templateOrQuestionDetails.data.consentShared = programJoinStatus.consentShared

				return resolve({
					success: true,
					message: templateOrQuestionDetails.message,
					data: templateOrQuestionDetails.data,
					result: templateOrQuestionDetails.data,
				})
			} catch (error) {
				return resolve({
					success: false,
					status: error.status ? error.status : HTTP_STATUS_CODE.internal_server_error.status,
					message: error.message,
				})
			}
		})
	}

	/**
	 * Generate assigned projects query
	 * @method
	 * @name generateAssignedProjectsQuery
	 * @param {String} userId - Logged in user id.
	 * @param {Object} requestedData - request body data.
	 * @param {String} filter - query filters.
	 * @returns {Object}
	 */
	static async generateAssignedProjectsQuery(userId, requestedData, filter) {
		return new Promise(async (resolve, reject) => {
			try {
				let query = { isDeleted: false }

				if (process.env.SUBMISSION_LEVEL === 'ENTITY' && requestedData.hasOwnProperty('entityId')) {
					// Use queryBasedOnRoleAndLocation function to form query for acl.visibility = SCOPE projects
					let queryData = await this.queryBasedOnRoleAndLocation(
						_.omit(requestedData, ['entityId']),
						'',
						'acl'
					)
					// status of the project could be anything, hence deleting status property from the querydata
					delete queryData.data.status
					// isReusable field doesn't exist for projects model hence removing the key
					delete queryData.data.isReusable

					let matchQuery = queryData.data

					// Construct query for projects accessible by the user
					query = {
						entityId: requestedData.entityId,
						'solutionInformation.submissionLevel': process.env.SUBMISSION_LEVEL,
						$or: [
							{ 'acl.visibility': CONSTANTS.common.PROJECT_VISIBILITY_ALL },
							{
								'acl.visibility': CONSTANTS.common.PROJECT_VISIBILITY_SPECIFIC,
								'acl.users': { $in: [userId] },
							},
							{ 'acl.visibility': CONSTANTS.common.PROJECT_VISIBILITY_SCOPE, ...matchQuery },
							{ 'acl.visibility': CONSTANTS.common.PROJECT_VISIBILITY_SELF, userId: userId },
						],
					}
				} else {
					query['userId'] = userId

					if (filter && filter !== '') {
						if (filter === CONSTANTS.common.CREATED_BY_ME) {
							query['referenceFrom'] = { $ne: CONSTANTS.common.LINK }
							query['isAPrivateProgram'] = { $ne: false }
						} else if (filter === CONSTANTS.common.ASSIGN_TO_ME) {
							query['isAPrivateProgram'] = false
						} else {
							query['$or'] = [
								{ $and: [{ programId: { $exists: false } }, { projectTemplateId: { $exists: true } }] },
								{
									$and: [
										{ programId: { $exists: true } },
										{ isAPrivateProgram: true },
										{ projectTemplateId: { $exists: true } },
									],
								},
							]
						}
					}
				}
				return resolve({
					success: true,
					data: query,
				})
			} catch (error) {
				return reject({
					status: error.status || HTTP_STATUS_CODE.internal_server_error.status,

					message: error.message || HTTP_STATUS_CODE.internal_server_error.message,

					errorObject: error,
				})
			}
		})
	}
}
