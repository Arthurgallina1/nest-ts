import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { userInfo } from 'os';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskRepository } from './task.repository';
import { TaskStatus } from './tasks-status-enum';
import { TasksService } from './tasks.service';

//mocka repo e os metodos que vai usar (a mock fn é um spy)
const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

const mockUser = { username: 'TestUser', id: 1 };

const mockCreateTaskDto = {
  title: 'Mock title',
  description: 'mock description ',
};

describe('TasksService', () => {
  let tasksService;
  let taskRepository; //nao quero usar o repo de vdd, nem a conexão
  // então é preciso mockar e simular o taskReposito

  beforeEach(async () => {
    //usa o service de vdd aqui
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
        //a cada teste vai criar um novo modulo
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks', () => {
    it('get all tasks from the repository', async () => {
      taskRepository.getTasks.mockResolvedValue('someValue');

      expect(taskRepository.getTasks).not.toHaveBeenCalled();
      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'any search query',
      };
      // call taskService.getTasks and be called
      const result = await tasksService.getTasks(filters, mockUser);
      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('GetTaskById', () => {
    it('calls taskRepository.findOne() and succesfully retrieve and return the task', async () => {
      const mockTest = { title: 'Test task', description: 'Test desc' };
      taskRepository.findOne.mockResolvedValue(mockTest);
      const result = await tasksService.getTaskById(1, mockUser);
      expect(result).toEqual(mockTest);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: mockUser.id,
        },
      });
    });

    it('throws an error as task is not found', () => {
      taskRepository.findOne.mockResolvedValue(null);
      expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask', () => {
    it('call taskRepository.createTask and returns the result', async () => {
      const mockTest = { ...mockCreateTaskDto, status: 'OPEN' };
      taskRepository.createTask.mockResolvedValue(mockTest);
      const result = await tasksService.createTask(mockCreateTaskDto, mockUser);
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        mockCreateTaskDto,
        mockUser,
      );
      expect(result).toEqual(mockTest);
    });
  });

  describe('deleteTask', () => {
    it('call taskRepo.deleteTask and sucessfully deletes', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      expect(taskRepository.delete).not.toHaveBeenCalled();
      await tasksService.deleteTaskById(1, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userId: mockUser.id,
      });
    });

    it('throws and error as task could not be found', () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 }); //should throw
      expect(tasksService.deleteTaskById(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
