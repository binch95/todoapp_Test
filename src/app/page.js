'use client';

import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  TextField,
  CssBaseline,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import classNames from 'classnames';
import { RecoilRoot, atom, useRecoilState } from 'recoil';
import { FaBars, FaCheck, FaTrash } from 'react-icons/fa';
import dateToStr from './dateUtil';
import RootTheme from './theme';

const todosAtom = atom({
  key: 'app/todosAtom',
  default: JSON.parse(localStorage.getItem('todos')) || [],
});

const lastTodoIdAtom = atom({
  key: 'app/lastTodoIdAtom',
  default: parseInt(localStorage.getItem('lastTOdoId')) || 0,
});

function useTodosStatus() {
  const [todos, setTodos] = useRecoilState(todosAtom);
  const [lastTodoId, setLastTodoId] = useRecoilState(lastTodoIdAtom);
  const lastTodoIdRef = React.useRef(lastTodoId);

  lastTodoIdRef.current = lastTodoId;

  React.useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos);
      setTodos(parsedTodos);
      const maxId = parsedTodos.reduce((max, todo) => Math.max(max, todo.id), 0);
      setLastTodoId(maxId);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const toggleTodoCompletion = (id) => {
    const newTodos = todos.map((todo) => 
      todo.id !== id ? todo : { ...todo, completed: !todo.completed }
    );
    setTodos(newTodos);
  };

  const addTodo = (newContent) => {
    const id = ++lastTodoIdRef.current;
    setLastTodoId(id);
    const newTodo = {
      id,
      content: newContent,
      regDate: dateToStr(new Date()),
      completed: false,
    };
    setTodos((todos) => [newTodo, ...todos]);

    return id;
  };

  const removeTodo = (id) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };

  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodoCompletion,
  };
}

const NewTodoForm = ({ noticeSnackbarStatus }) => {
  const todosStatus = useTodosStatus();
  
  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.content.value = form.content.value.trim();
    if (form.content.value.length === 0) {
      alert('할 일 써');
      form.content.focus();
      return;
    }
    const newTodoId = todosStatus.addTodo(form.content.value);
    form.content.value = '';
    form.content.focus();
    noticeSnackbarStatus.open(`${newTodoId}번 todo 추가됨`);
  };

  return (
    <form className="tw-flex tw-flex-col tw-p-4 tw-gap-2" onSubmit={onSubmit}>
      <TextField
        multiline
        maxRows={4}
        name="content"
        id="outlined-basic"
        label="할 일 입력"
        variant="outlined"
        autoComplete="off"
      />
      <Button className="tw-text-bold" variant="contained" type="submit">
        추가
      </Button>
    </form>
  );
};

const TodoListItem = ({ todo, removeTodo }) => {
  const todosStatus = useTodosStatus();

  return (
    <li className="tw-mb-3" key={todo.id}>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-3">
        <div className="tw-flex tw-gap-x-2 tw-font-bold">
          <Chip className="tw-pt-[3px]" label={`번호 : ${todo.id}`} variant="outlined" />
          <Chip
            className="tw-pt-[3px]"
            label={`날짜 : ${todo.regDate}`}
            variant="outlined"
            color="primary"
          />
        </div>
        <div className="tw-rounded-[10px] tw-shadow tw-flex tw-text-[14px] tw-min-h-[80px]">
          <Button
            className="tw-flex-shrink-0 tw-rounded-[10px_0_0_10px]"
            color="inherit"
            onClick={() => todosStatus.toggleTodoCompletion(todo.id)}
          >
            <FaCheck
              className={classNames('tw-text-3xl', { 'tw-text-green-500': todo.completed })}
            />
          </Button>
          <div className="tw-bg-[#dcdcdc] tw-w-[2px] tw-h-[60px] tw-self-center"></div>
          <div className="tw-bg-blue-300 tw-flex tw-items-center tw-p-3 tw-flex-grow hover:tw-text-[--mui-color-primary-main] tw-whitespace-pre-wrap tw-leading-relaxed tw-break-words">
            할 일 : {todo.content}
          </div>
          <Button
            variant="contained"
            color="error"
            onClick={() => removeTodo(todo.id)}
            className="tw-mt-4"
          >
            삭제
            <FaTrash className="tw-ml-1" />
          </Button>
        </div>
      </div>
    </li>
  );
};

const TodoList = ({ noticeSnackbarStatus }) => {
  const todosStatus = useTodosStatus();

  const removeTodo = (id) => {
    if (confirm(`${id}번 할 일을 삭제하시겠습니까?`) === false) {
      return;
    }
    todosStatus.removeTodo(id);
    noticeSnackbarStatus.open(`${id}번 todo 삭제됨`, 'error');
  };

  return (
    <nav>
      할 일 갯수 : {todosStatus.todos.length}
      <ul>
        {todosStatus.todos.map((todo) => (
          <TodoListItem
            key={todo.id}
            todo={todo}
            removeTodo={removeTodo}
          />
        ))}
      </ul>
    </nav>
  );
};

function NoticeSnackbar({ status }) {
  return (
    <Snackbar
      open={status.opened}
      autoHideDuration={status.autoHideDuration}
      onClose={status.close}
    >
      <Alert variant={status.variant} severity={status.severity}>
        {status.msg}
      </Alert>
    </Snackbar>
  );
}

function useNoticeSnackbarStatus() {
  const [opened, setOpened] = React.useState(false);
  const [autoHideDuration, setAutoHideDuration] = React.useState(null);
  const [variant, setVariant] = React.useState(null);
  const [severity, setSeverity] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  
  const open = (msg, severity = 'success', autoHideDuration = 3000, variant = 'filled') => {
    setOpened(true);
    setMsg(msg);
    setSeverity(severity);
    setAutoHideDuration(autoHideDuration);
    setVariant(variant);
  };

  const close = () => {
    setOpened(false);
  };

  return {
    opened,
    open,
    close,
    autoHideDuration,
    variant,
    severity,
    msg,
  };
}

function App() {
  const noticeSnackbarStatus = useNoticeSnackbarStatus();
  const todosStatus = useTodosStatus();
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <div className="tw-flex-1">
            <FaBars className="tw-cursor-pointer" />
          </div>
          <div className="logo-box">
            <a href="/" className="tw-font-bold">
              로고
            </a>
          </div>
          <div className="tw-flex-1 tw-flex tw-justify-end">글쓰기</div>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <NoticeSnackbar status={noticeSnackbarStatus} />
      <NewTodoForm noticeSnackbarStatus={noticeSnackbarStatus} />
      <TodoList noticeSnackbarStatus={noticeSnackbarStatus} />
    </>
  );
}

export default function ThemeApp() {
  const theme = RootTheme();

  return (
    <RecoilRoot>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </RecoilRoot>
  );
  
}
