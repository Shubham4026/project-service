/**
 * name : templateTasks.js
 * author : Aman
 * created-date : 22-July-2020
 * Description : Projects template tasks related information.
 */

// Dependencies
const csv = require('csvtojson')
const projectTemplateTasksHelper = require(MODULES_BASE_PATH + '/project/templateTasks/helper')
const utils = require('@helpers/utils')
const projectQueries = require(DB_QUERY_BASE_PATH + '/projects')
const projectTemplateQueries = require(DB_QUERY_BASE_PATH + '/projectTemplates')
const projectTemplateTaskQueries = require(DB_QUERY_BASE_PATH + '/projectTemplateTask')

/**
 * ProjectTemplateTasks
 * @class
 */

// Helper function to recursively update a task by externalId in a nested tasks array
function updateTaskInTree(tasks, targetExternalId, updateData) {
	for (let i = 0; i < tasks.length; i++) {
		if (tasks[i].externalId === targetExternalId) {
			// Update only the provided fields
			for (const key of Object.keys(updateData)) {
				tasks[i][key] = updateData[key]
			}
			// Do not touch children unless explicitly present in updateData
			return true
		}
		if (Array.isArray(tasks[i].children) && tasks[i].children.length > 0) {
			if (updateTaskInTree(tasks[i].children, targetExternalId, updateData)) {
				return true
			}
		}
	}
	return false
}

// Helper function to recursively remove a task by externalId from a nested tasks array
function removeTaskFromTree(tasks, targetExternalId) {
	if (!tasks || !Array.isArray(tasks)) return false

	for (let i = 0; i < tasks.length; i++) {
		// Check current task
		if (tasks[i].externalId === targetExternalId) {
			tasks.splice(i, 1)
			return true
		}
		// Check children
		if (tasks[i].children && Array.isArray(tasks[i].children)) {
			if (removeTaskFromTree(tasks[i].children, targetExternalId)) {
				return true
			}
		}
	}
	return false
}

// Helper function to upsert a task (and its children) into a tasks array by externalId
function upsertTaskInTree(tasks, newTask) {
	const idx = tasks.findIndex((t) => t.externalId === newTask.externalId)
	if (idx !== -1) {
		// Merge/update the existing task (shallow merge)
		for (const key of Object.keys(newTask)) {
			if (key === 'children' && Array.isArray(newTask.children)) {
				// Recursively upsert children
				if (!Array.isArray(tasks[idx].children)) tasks[idx].children = []
				for (const child of newTask.children) {
					upsertTaskInTree(tasks[idx].children, child)
				}
			} else {
				tasks[idx][key] = newTask[key]
			}
		}
	} else {
		// Add as new
		tasks.push(newTask)
	}
}

module.exports = class ProjectTemplateTasks extends Abstract {
	/**
	 * @apiDefine errorBody
	 * @apiError {String} status 4XX,5XX
	 * @apiError {String} message Error
	 */

	/**
	 * @apiDefine successBody
	 *  @apiSuccess {String} status 200
	 * @apiSuccess {String} result Data
	 */

	constructor() {
		super('project-template-tasks')
	}

	/**
	 * @api {post} /project/v1/project/templateTasks/bulkCreate/:projectTemplateId
	 * Bulk create project template tasks.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {File} projectTemplateTasks Mandatory project template tasks file of type CSV.
	 * @apiSampleRequest /project/v1/project/templateTasks/bulkCreate/5f2adc57eb351a5a9c68f403
	 * @apiUse successBody
	 * @apiUse errorBody
	 */

	/**
	 * Upload project template tasks
	 * @method
	 * @name bulkCreate
	 * @returns {JSON} returns uploaded project templates.
	 */

	async bulkCreate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!req.files || !req.files.projectTemplateTasks) {
					return resolve({
						message: CONSTANTS.apiResponses.PROJECT_TEMPLATES_TASKS_CSV,
					})
				}

				const templateTasks = await csv().fromString(req.files.projectTemplateTasks.data.toString())
				const projectTemplateId = req.params._id

				// Check if template exists
				const existingTemplate = await database.models.projectTemplates.findOne({ _id: projectTemplateId })
				if (!existingTemplate) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'Project template not found',
					})
				}

				const projectTemplateTasks = await projectTemplateTasksHelper.bulkCreate(
					templateTasks,
					req.params._id,
					req.userDetails.userInformation.userId
				)

				return resolve(projectTemplateTasks)
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
	 * @api {post} /project/v1/project/templateTasks/bulkUpdate/:projectTemplateId
	 * Bulk update project template tasks.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {File} projectTemplateTasks Mandatory project template tasks file of type CSV.
	 * @apiSampleRequest /project/v1/project/templateTasks/bulkUpdate/5f2adc57eb351a5a9c68f403
	 * @apiUse successBody
	 * @apiUse errorBody
	 */

	/**
	 * Upload project template tasks
	 * @method
	 * @name bulkUpdate
	 * @returns {JSON} returns uploaded project templates.
	 */

	async bulkUpdate(req) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!req.files || !req.files.projectTemplateTasks) {
					return resolve({
						message: CONSTANTS.apiResponses.PROJECT_TEMPLATES_TASKS_CSV,
					})
				}

				const templateTasks = await csv().fromString(req.files.projectTemplateTasks.data.toString())

				const projectTemplateTasks = await projectTemplateTasksHelper.bulkUpdate(
					templateTasks,
					req.params._id,
					req.userDetails.userInformation.userId
				)

				return resolve(projectTemplateTasks)
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
	 * @api {post} /project/v1/project/templateTasks/update/:taskId 
	 * Update projects template.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiSampleRequest /project/v1/project/templateTasks/update/6006b5cca1a95727dbcdf648
	 * @apiHeader {String} internal-access-token internal access token 
	 * @apiHeader {String} X-authenticated-user-token Authenticity token  
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiParamExample {json} Response:
	 * {
		"status": 200,
		"message": "template task updated successfully"
	  }
	*/

	/**
	 * Update project templates task
	 * @method
	 * @name update
	 * @returns {JSON} returns uploaded project template task.
	 */

	async update(req) {
		return new Promise(async (resolve, reject) => {
			try {
				let projectTemplateTask = await projectTemplateTasksHelper.update(
					req.params._id,
					req.body,
					req.userDetails.userInformation.userId
				)

				projectTemplateTask.result = projectTemplateTask.data

				return resolve(projectTemplateTask)
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
	 * @api {post} /project/v1/project/templateTasks/bulkCreateJson/:solutionId
	 * Bulk create project template tasks using JSON.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {Object[]} tasks Array of task objects.
	 * @apiParam {String} tasks.externalId Mandatory external ID of the task.
	 * @apiParam {String} tasks.name Mandatory name of the task.
	 * @apiParam {String} tasks.type Type of task (CONTENT/ASSESSMENT/OBSERVATION/IMPROVEMENT_PROJECT).
	 * @apiParam {String} [tasks.hasAParentTask] Whether task has a parent (YES/NO).
	 * @apiParam {String} [tasks.parentTaskId] ID of parent task if hasAParentTask is YES.
	 * @apiParam {String} [tasks.solutionId] Solution ID if task type requires it.
	 * @apiParam {String} [tasks.solutionType] Type of solution if task type requires it.
	 * @apiParam {String} [tasks.solutionSubType] Subtype of solution if task type requires it.
	 * @apiParam {Boolean} [tasks.isDeletable] Whether task can be deleted.
	 * @apiSampleRequest /project/v1/project/templateTasks/bulkCreateJson/5f2adc57eb351a5a9c68f403
	 * @apiUse successBody
	 * @apiUse errorBody
	 */

	/**
	 * Bulk create project template tasks using JSON
	 * @method
	 * @name bulkCreateJson
	 * @returns {JSON} returns created project template tasks.
	 */

	async bulkCreateJson(req) {
		return new Promise(async (resolve, reject) => {
			try {
				const solutionId = req.params._id

				// 1. Validate solutionId
				if (!solutionId) {
					return reject({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'Solution ID is required',
					})
				}

				// 2. Get tasks data from request body
				const tasks = req.body.tasks
				if (!tasks || !Array.isArray(tasks)) {
					return reject({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'Tasks array is required in request body',
					})
				}

				// 3. Fetch all projects for this solution
				const projectsResponse = await projectTemplateQueries.getProjectsBySolutionId(solutionId)
				if (!projectsResponse.success) {
					return reject({
						status: HTTP_STATUS_CODE.internal_server_error.status,
						message: projectsResponse.message || 'Failed to fetch projects',
					})
				}

				const projects = projectsResponse.data
				if (!projects || !projects.length) {
					return reject({
						status: HTTP_STATUS_CODE.not_found.status,
						message: 'No projects found for this solution',
					})
				}

				// 4. Get the project template ID from the first project
				const projectTemplateId = projects[0].projectTemplateId
				if (!projectTemplateId) {
					return reject({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'Project template ID not found',
					})
				}

				// 5. Process tasks to add metaInformation
				const processedTasks = tasks.map((task) => {
					const metaInformation = {
						hasAParentTask: task.hasAParentTask || 'NO',
						parentTaskOperator: task.parentTaskOperator || '',
						parentTaskValue: task.parentTaskValue || '',
						parentTaskId: task.parentTaskId || '',
						minNoOfSubmissionsRequired: task.minNoOfSubmissionsRequired || 1,
						startDate: task.startDate || '',
						endDate: task.endDate || '',
					}

					delete task.hasAParentTask
					delete task.parentTaskOperator
					delete task.parentTaskValue
					delete task.parentTaskId
					delete task.minNoOfSubmissionsRequired

					return {
						...task,
						metaInformation,
						hasSubTasks: false,
						children: [],
						visibleIf: [],
						learningResources: task.learningResources || [],
						solutionDetails: task.solutionDetails || {
							solutionType: '',
							solutionId: '',
							solutionSubType: '',
						},
					}
				})

				// 6. Create tasks and update projects in one go
				const projectIds = projects.map((project) => project._id)

				// Upsert tasks into each project's tasks array
				for (const project of projects) {
					if (!Array.isArray(project.tasks)) project.tasks = []
					for (const task of processedTasks) {
						upsertTaskInTree(project.tasks, task)
					}
					// Save the updated project tasks (if needed, e.g., with projectQueries.findOneAndUpdate)
					// await projectQueries.findOneAndUpdate({ _id: project._id }, { $set: { tasks: project.tasks, updatedAt: new Date() } });
				}

				const result = await projectTemplateTasksHelper.bulkCreateJson(
					processedTasks,
					projectTemplateId,
					req.userDetails.userInformation.userId,
					projectIds
				)

				if (!result || !result.success) {
					return reject({
						status: HTTP_STATUS_CODE.internal_server_error.status,
						message: result.message || 'Failed to create project template tasks',
					})
				}

				// 7. Return results
				return resolve({
					status: HTTP_STATUS_CODE.ok.status,
					message: 'Bulk task creation completed',
					result: result.data,
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
	 * @api {post} /project/v1/project/templateTasks/updateTask/:solutionId?externalId=externalIdValue
	 * Update a specific task in all projects associated with a solution.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {String} solutionId Solution ID (URL param)
	 * @apiParam {String} externalId Task external ID (query param)
	 * @apiParam {Object} body Task data to update
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiSampleRequest /project/v1/project/templateTasks/updateTask/5f2adc57eb351a5a9c68f403?externalId=task-1
	 */

	/**
	 * Update a specific task in all projects associated with a solution
	 * @method
	 * @name updateTask
	 * @returns {JSON} returns updated project tasks.
	 */

	async updateTask(req) {
		return new Promise(async (resolve, reject) => {
			try {
				const solutionId = req.params._id
				const externalId = req.query.externalId
				const updateData = req.body
				const userId = req.userDetails.userInformation?.userId || req.userDetails.id

				if (!solutionId) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'solutionId is required',
					})
				}

				// 1. Fetch all projects for this solution
				const projectsResponse = await projectTemplateQueries.getProjectsBySolutionId(solutionId)
				if (!projectsResponse.success) {
					return reject({
						status: HTTP_STATUS_CODE.internal_server_error.status,
						message: projectsResponse.message || 'Failed to fetch projects',
					})
				}

				const projects = projectsResponse.data
				if (!projects || !projects.length) {
					return reject({
						status: HTTP_STATUS_CODE.not_found.status,
						message: 'No projects found for this solution',
					})
				}

				// 2. Process each project (removed status check)
				const updatedProjects = []
				for (const project of projects) {
					const projectId = project._id
					const projectTemplateId = project.projectTemplateId
					const projectTasks = project.tasks || []
					const updatedTaskIds = []

					// If tasks array is present in updateData, update each
					if (Array.isArray(updateData.tasks)) {
						for (const taskData of updateData.tasks) {
							// Get the template task
							const templateTasks = await projectTemplateTasksHelper.getTasksByExternalIdAndTemplateId(
								taskData.externalId,
								projectTemplateId
							)
							if (templateTasks && templateTasks.length) {
								await projectTemplateTasksHelper.update(templateTasks[0]._id, taskData, userId)
							}
							const updated = updateTaskInTree(projectTasks, taskData.externalId, taskData)
							if (updated) updatedTaskIds.push(taskData.externalId)
						}
					} else if (externalId) {
						// Fallback: update single task by externalId and updateData
						const templateTasks = await projectTemplateTasksHelper.getTasksByExternalIdAndTemplateId(
							externalId,
							projectTemplateId
						)
						if (templateTasks && templateTasks.length) {
							await projectTemplateTasksHelper.update(templateTasks[0]._id, updateData, userId)
						}
						const updated = updateTaskInTree(projectTasks, externalId, updateData)
						if (updated) updatedTaskIds.push(externalId)
					}

					if (updatedTaskIds.length > 0) {
						await projectQueries.findOneAndUpdate(
							{ _id: projectId },
							{ $set: { tasks: projectTasks, updatedAt: new Date() } }
						)
						updatedProjects.push({
							projectId: projectId,
							projectTemplateId: projectTemplateId,
							updatedTaskIds: updatedTaskIds,
						})
					}
				}

				if (!updatedProjects.length) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'No tasks were updated. Either tasks were not found.',
					})
				}

				return resolve({
					status: HTTP_STATUS_CODE.ok.status,
					message: 'Tasks updated successfully',
					result: {
						updatedProjects: updatedProjects,
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
	 * @api {delete} /project/v1/project/templateTasks/deleteTask/:projectId?externalId=externalIdValue
	 * Delete a project template task and its corresponding project task.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {String} projectId Project ID (URL param)
	 * @apiParam {String} externalId Task external ID (query param)
	 * @apiUse successBody
	 * @apiUse errorBody
	 * @apiSampleRequest /project/v1/project/templateTasks/deleteTask/5f2adc57eb351a5a9c68f403?externalId=task-1
	 */

	/**
	 * Delete a project template task and its corresponding project task
	 * @method
	 * @name deleteTask
	 * @returns {JSON} returns deletion status of project template task and project task.
	 */

	async deleteTask(req) {
		return new Promise(async (resolve, reject) => {
			try {
				const solutionId = req.params._id
				const externalId = req.query.externalId
				const userId = req.userDetails.userInformation?.userId || req.userDetails.id

				if (!solutionId || !externalId) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'solutionId and externalId are required',
					})
				}

				// 1. Fetch all projects linked to the solution
				const projectsResponse = await projectTemplateQueries.getProjectsBySolutionId(solutionId)
				if (!projectsResponse.success) {
					return reject({
						status: HTTP_STATUS_CODE.internal_server_error.status,
						message: projectsResponse.message || 'Failed to fetch projects',
					})
				}

				const projects = projectsResponse.data
				if (!projects || !projects.length) {
					return reject({
						status: HTTP_STATUS_CODE.not_found.status,
						message: 'No projects found for this solution',
					})
				}

				// Helper function to check if any task with given externalId is started
				const isTaskStartedInAnyProject = (projects, targetExternalId) => {
					for (const project of projects) {
						const findStartedTask = (tasks) => {
							if (!tasks || !Array.isArray(tasks)) return false

							for (const task of tasks) {
								if (task.externalId === targetExternalId) {
									if (task.status && task.status !== 'notStarted') {
										return true
									}
								}
								if (task.children && Array.isArray(task.children)) {
									if (findStartedTask(task.children)) return true
								}
							}
							return false
						}

						if (findStartedTask(project.tasks)) {
							return true
						}
					}
					return false
				}

				// First check if task is started in any project
				if (isTaskStartedInAnyProject(projects, externalId)) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: `Cannot delete task ${externalId} as it has already started in one or more projects`,
					})
				}

				let deletedTasks = []

				// Helper function to check if all children are not started
				const areAllChildrenNotStarted = (children) => {
					if (!children || !Array.isArray(children)) return true
					return children.every((child) => !child.status || child.status === 'notStarted')
				}

				// Helper function to find task by externalId
				const findTaskByExternalId = (tasks, targetId) => {
					if (!tasks || !Array.isArray(tasks)) return null

					for (const task of tasks) {
						if (task.externalId === targetId) {
							return task
						}
						if (task.children && Array.isArray(task.children)) {
							const foundInChildren = findTaskByExternalId(task.children, targetId)
							if (foundInChildren) return foundInChildren
						}
					}
					return null
				}

				for (const project of projects) {
					const projectId = project._id
					const projectTasks = project.tasks || []
					const projectTemplateId = project.projectTemplateId

					// First check in main tasks array
					const mainTask = projectTasks.find((task) => task.externalId === externalId)

					if (mainTask) {
						// If found in main tasks, check all its children
						if (areAllChildrenNotStarted(mainTask.children)) {
							// All children are not started, proceed with deletion

							// Delete from projectTemplateTasks
							const templateTasks = await database.models.projectTemplateTasks
								.find({
									externalId: externalId,
									projectTemplateId: projectTemplateId,
								})
								.lean()

							if (templateTasks && templateTasks.length > 0) {
								await database.models.projectTemplateTasks.deleteOne({ _id: templateTasks[0]._id })
							}

							// Remove from project tasks
							const updatedTasks = projectTasks.filter((task) => task.externalId !== externalId)
							await projectQueries.findOneAndUpdate(
								{ _id: projectId },
								{ $set: { tasks: updatedTasks, updatedAt: new Date() } }
							)

							deletedTasks.push({
								projectId: projectId,
								externalId: externalId,
								templateTaskId: templateTasks && templateTasks.length > 0 ? templateTasks[0]._id : null,
							})
						} else {
							return resolve({
								status: HTTP_STATUS_CODE.bad_request.status,
								message: `Cannot delete task ${externalId} as it has started children`,
							})
						}
					} else {
						// Not found in main tasks, search in children
						const childTask = findTaskByExternalId(projectTasks, externalId)

						if (childTask) {
							// Found in children, check its status
							if (!childTask.status || childTask.status === 'notStarted') {
								// Delete from projectTemplateTasks
								const templateTasks = await database.models.projectTemplateTasks
									.find({
										externalId: externalId,
										projectTemplateId: projectTemplateId,
									})
									.lean()

								if (templateTasks && templateTasks.length > 0) {
									await database.models.projectTemplateTasks.deleteOne({ _id: templateTasks[0]._id })
								}

								// Remove from project tasks
								const removed = removeTaskFromTree(projectTasks, externalId)
								if (removed) {
									await projectQueries.findOneAndUpdate(
										{ _id: projectId },
										{ $set: { tasks: projectTasks, updatedAt: new Date() } }
									)

									deletedTasks.push({
										projectId: projectId,
										externalId: externalId,
										templateTaskId:
											templateTasks && templateTasks.length > 0 ? templateTasks[0]._id : null,
									})

									// Skip to next project since we've successfully deleted the task
									continue
								}
							} else {
								// Only return error if we haven't successfully deleted the task yet
								if (!deletedTasks.some((task) => task.externalId === externalId)) {
									return resolve({
										status: HTTP_STATUS_CODE.bad_request.status,
										message: `Cannot delete task ${externalId} as it has already started`,
									})
								}
							}
						}
					}
				}

				if (!deletedTasks.length) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'No tasks deleted. Either tasks were already started or not found.',
					})
				}

				return resolve({
					status: HTTP_STATUS_CODE.ok.status,
					message: 'Tasks deleted successfully',
					result: deletedTasks,
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
	 * @api {delete} /project/v1/project/templateTasks/delete/:solutionId
	 * Delete all projects and associated template tasks for a solution.
	 * @apiVersion 1.0.0
	 * @apiGroup Project Template Tasks
	 * @apiParam {String} solutionId Solution ID (URL param)
	 * @apiSampleRequest /project/v1/project/templateTasks/delete/5f2adc57eb351a5a9c68f403
	 * @apiUse successBody
	 * @apiUse errorBody
	 */

	/**
	 * Delete all projects and associated template tasks for a solution
	 * @method
	 * @name delete
	 * @returns {JSON} returns deletion status
	 */

	async delete(req) {
		return new Promise(async (resolve, reject) => {
			try {
				const solutionId = req.params._id

				if (!solutionId) {
					return resolve({
						status: HTTP_STATUS_CODE.bad_request.status,
						message: 'Solution ID is required',
					})
				}

				// Get all projects for this solution
				const projectsResponse = await projectTemplateQueries.getProjectsBySolutionId(solutionId)
				if (!projectsResponse.success) {
					return reject({
						status: HTTP_STATUS_CODE.internal_server_error.status,
						message: projectsResponse.message || 'Failed to fetch projects',
					})
				}

				const projects = projectsResponse.data
				if (!projects || !projects.length) {
					return resolve({
						status: HTTP_STATUS_CODE.not_found.status,
						message: 'No projects found for this solution',
					})
				}

				// Check if any project has started tasks
				for (const project of projects) {
					const hasStartedTasks =
						project.tasks &&
						project.tasks.some((task) => {
							// Check main task status
							if (task.status && task.status !== CONSTANTS.common.NOT_STARTED_STATUS) {
								return true
							}
							// Check children tasks status
							if (task.children && Array.isArray(task.children)) {
								return task.children.some(
									(childTask) =>
										childTask.status && childTask.status !== CONSTANTS.common.NOT_STARTED_STATUS
								)
							}
							return false
						})

					if (hasStartedTasks) {
						return resolve({
							status: HTTP_STATUS_CODE.bad_request.status,
							message: `Cannot delete project ${project._id} as it has started tasks or subtasks`,
						})
					}
				}

				const deletedProjects = []
				const deletedTemplates = new Set()
				const deletedSolutions = new Set()
				const deletedPrograms = new Set()
				const deletedEntities = {
					projects: [],
					templates: [],
					solutions: [],
					programs: [],
					entities: [],
					files: [],
				}

				// Get solution and program details first
				const solution = await database.models.solutions.findOne({ _id: solutionId })
				if (!solution) {
					return resolve({
						status: HTTP_STATUS_CODE.not_found.status,
						message: 'Solution not found',
					})
				}

				const programId = solution.programId
				const program = programId ? await database.models.programs.findOne({ _id: programId }) : null

				// Process each project
				for (const project of projects) {
					const projectId = project._id
					const projectTemplateId = project.projectTemplateId

					// 1. Delete project document and all its references
					await database.models.projects.deleteOne({ _id: projectId })
					await database.models.projects.deleteMany({ parentProjectId: projectId })
					await database.models.projects.deleteMany({ referenceProjectId: projectId })
					deletedProjects.push(projectId)
					deletedEntities.projects.push(projectId)

					// 2. Get project template to fetch task IDs
					const projectTemplate = await database.models.projectTemplates.findOne({ _id: projectTemplateId })
					if (projectTemplate) {
						// Delete all tasks associated with this template
						if (projectTemplate.tasks && projectTemplate.tasks.length > 0) {
							const taskIds = projectTemplate.tasks.map((task) => task)

							// Delete specific template tasks
							await database.models.projectTemplateTasks.deleteMany({
								_id: { $in: taskIds },
							})

							// Delete tasks marked as deleted
							await database.models.projectTemplateTasks.deleteMany({
								_id: { $in: taskIds },
								isDeleted: true,
							})

							// Delete any remaining tasks for this template
							await database.models.projectTemplateTasks.deleteMany({
								projectTemplateId,
							})

							deletedEntities.entities.push(...taskIds)
						}

						// Clear the tasks array in the template
						await database.models.projectTemplates.updateOne(
							{ _id: projectTemplateId },
							{ $set: { tasks: [] } }
						)
					}

					// 3. Delete project template and any related templates
					const relatedTemplates = await database.models.projectTemplates.find({
						$or: [
							{ _id: projectTemplateId },
							{ externalId: projectTemplate?.externalId },
							{ title: projectTemplate?.title },
						],
					})

					// Delete all related templates and their references
					for (const template of relatedTemplates) {
						await database.models.projectTemplates.deleteOne({ _id: template._id })
						await database.models.projectTemplates.deleteMany({ parentTemplateId: template._id })
						await database.models.projectTemplates.deleteMany({ referenceTemplateId: template._id })
						deletedTemplates.add(template._id)
						deletedEntities.templates.push(template._id)
					}
				}

				// 4. Delete solution and its associated data
				if (solution) {
					// Delete solution files
					if (solution.files && solution.files.length > 0) {
						for (const file of solution.files) {
							if (file.sourcePath) {
								try {
									await utils.deleteFile(file.sourcePath)
									deletedEntities.files.push(file.sourcePath)
								} catch (error) {
									console.error('Error deleting file:', file.sourcePath, error)
								}
							}
						}
					}

					// Delete solution references
					await database.models.solutions.deleteMany({ parentSolutionId: solutionId })
					await database.models.solutions.deleteMany({ referenceSolutionId: solutionId })

					// Delete solution document
					await database.models.solutions.deleteOne({ _id: solutionId })

					deletedSolutions.add(solutionId)
					deletedEntities.solutions.push(solutionId)
				}

				// 5. Delete program and its associated data
				if (program) {
					// Delete program files
					if (program.files && program.files.length > 0) {
						for (const file of program.files) {
							if (file.sourcePath) {
								try {
									await utils.deleteFile(file.sourcePath)
									deletedEntities.files.push(file.sourcePath)
								} catch (error) {
									console.error('Error deleting file:', file.sourcePath, error)
								}
							}
						}
					}

					// Delete program references
					await database.models.programs.deleteMany({ parentProgramId: programId })
					await database.models.programs.deleteMany({ referenceProgramId: programId })

					// Delete program document
					await database.models.programs.deleteOne({ _id: programId })

					deletedPrograms.add(programId)
					deletedEntities.programs.push(programId)
				}

				return resolve({
					status: HTTP_STATUS_CODE.ok.status,
					message: 'Projects and associated data deleted successfully',
					result: {
						deletedProjects: deletedProjects,
						deletedTemplates: Array.from(deletedTemplates),
						deletedSolutions: Array.from(deletedSolutions),
						deletedPrograms: Array.from(deletedPrograms),
						deletedEntities: deletedEntities,
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
}
