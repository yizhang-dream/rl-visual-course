/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · L1 基本概念 —— 内容数据（全部双语）
   书：Shiyu Zhao《Mathematical Foundation of Reinforcement Learning》Ch.1
   代码：book-repo/Code for grid world/python_version（IUSLab, Westlake）
   ═══════════════════════════════════════════════════════════ */

window.DATA = (function () {
  /* ---------- 书中 3×3 世界常量 ---------- */
  // 动作（书本编号，全书统一）：a1上 a2右 a3下 a4左 a5原地
  const BOOK_ACTIONS = [
    { id: 1, sym: 'a1', zh: '向上', en: 'upward',    dx: 0,  dy: -1 },
    { id: 2, sym: 'a2', zh: '向右', en: 'rightward', dx: 1,  dy: 0  },
    { id: 3, sym: 'a3', zh: '向下', en: 'downward',  dx: 0,  dy: 1  },
    { id: 4, sym: 'a4', zh: '向左', en: 'leftward',  dx: -1, dy: 0  },
    { id: 5, sym: 'a5', zh: '原地', en: 'still',     dx: 0,  dy: 0  },
  ];

  // Table 1.1 状态转移表（书本 3×3，禁区可进入）：transition[s][a] = 下一状态
  const T3 = [
    [1,2,4,1,1], [2,3,5,1,2], [3,3,6,2,3],
    [1,5,7,4,4], [2,6,8,4,5], [3,6,9,5,6],
    [4,8,7,7,7], [5,9,8,7,8], [6,9,9,8,9],
  ];

  // Table 1.3 奖励表（符号）：b=边界−1  f=禁区−1  t=目标+1  0=其他0
  const R3SYM = [
    ['b',0,0,'b',0], ['b',0,0,0,0], ['b','b','f',0,0],
    [0,0,'f','b',0], [0,'f',0,0,0], [0,'b','t',0,'f'],
    [0,0,'b','b','f'], [0,'t','b','f',0], ['f','b','b',0,'t'],
  ];

  // 三个策略（每行 5 个动作概率，书本动作序）
  const P1 = [ // Fig 1.4 / 1.6(a) 确定性策略
    [0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],
    [0,1,0,0,0],[0,0,1,0,0],[0,0,1,0,0],
    [0,1,0,0,0],[0,1,0,0,0],[0,0,0,0,1],
  ];
  const P2 = [ // Fig 1.6(b) 确定性策略（经过禁区）
    [0,0,1,0,0],[0,0,1,0,0],[0,0,0,1,0],
    [0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],
    [0,1,0,0,0],[0,1,0,0,0],[0,0,0,0,1],
  ];
  const PS = [ // Table 1.2 随机策略
    [0,.5,.5,0,0],[0,0,1,0,0],[0,0,0,1,0],
    [0,1,0,0,0],[0,0,1,0,0],[0,0,1,0,0],
    [0,1,0,0,0],[0,1,0,0,0],[0,0,0,0,1],
  ];

  // 两条轨迹（从 s1 出发）：states / actions / rewards
  const TRAJ1 = { states: [1,2,5,8,9], actions: [2,3,3,2], rewards: [0,0,0,1] };
  const TRAJ2 = { states: [1,4,7,8,9], actions: [3,3,2,2], rewards: [0,-1,0,1] };

  /* ---------- 作业 4×4 配置 ---------- */
  const A4 = {
    size: 4, target: 12, forbidden: [8, 10], start: 1, gamma: 0.9,
    rewards: { boundary: -1, forbidden: -1, target: 1, other: 0 },
  };

  /* ---------- 代码精讲源码 ---------- */
  const srcInit = `__credits__ = ["Intelligent Unmanned Systems Laboratory at Westlake University."]

import sys
sys.path.append("..")
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from examples.arguments import args

class GridWorld():

    def __init__(self, env_size=args.env_size,
                 start_state=args.start_state,
                 target_state=args.target_state,
                 forbidden_states=args.forbidden_states):

        self.env_size = env_size
        self.num_states = env_size[0] * env_size[1]
        self.start_state = start_state
        self.target_state = target_state
        self.forbidden_states = forbidden_states

        self.agent_state = start_state
        self.action_space = args.action_space
        self.reward_target = args.reward_target
        self.reward_forbidden = args.reward_forbidden
        self.reward_step = args.reward_step

        self.canvas = None
        self.animation_interval = args.animation_interval

        self.color_forbid = (0.9290,0.6940,0.125)
        self.color_target = (0.3010,0.7450,0.9330)
        self.color_policy = (0.4660,0.6740,0.1880)
        self.color_trajectory = (0, 1, 0)
        self.color_agent = (0,0,1)`;

  const srcStep = `    def reset(self):
        self.agent_state = self.start_state
        self.traj = [self.agent_state]
        return self.agent_state, {}

    def step(self, action):
        assert action in self.action_space, "Invalid action"

        next_state, reward  = self._get_next_state_and_reward(self.agent_state, action)
        done = self._is_done(next_state)

        x_store = next_state[0] + 0.03 * np.random.randn()
        y_store = next_state[1] + 0.03 * np.random.randn()
        state_store = tuple(np.array((x_store,  y_store)) + 0.2 * np.array(action))
        state_store_2 = (next_state[0], next_state[1])

        self.agent_state = next_state

        self.traj.append(state_store)
        self.traj.append(state_store_2)
        return self.agent_state, reward, done, {}`;

  const srcTrans = `    def _get_next_state_and_reward(self, state, action):
        x, y = state
        new_state = tuple(np.array(state) + np.array(action))
        if y + 1 > self.env_size[1] - 1 and action == (0,1):    # down
            y = self.env_size[1] - 1
            reward = self.reward_forbidden
        elif x + 1 > self.env_size[0] - 1 and action == (1,0):  # right
            x = self.env_size[0] - 1
            reward = self.reward_forbidden
        elif y - 1 < 0 and action == (0,-1):   # up
            y = 0
            reward = self.reward_forbidden
        elif x - 1 < 0 and action == (-1, 0):  # left
            x = 0
            reward = self.reward_forbidden
        elif new_state == self.target_state:  # stay
            x, y = self.target_state
            reward = self.reward_target
        elif new_state in self.forbidden_states:  # stay
            x, y = state
            reward = self.reward_forbidden
        else:
            x, y = new_state
            reward = self.reward_step

        return (x, y), reward

    def _is_done(self, state):
        return state == self.target_state`;

  const srcRender = `    def render(self, animation_interval=args.animation_interval):
        if self.canvas is None:
            plt.ion()
            self.canvas, self.ax = plt.subplots()
            self.ax.set_xlim(-0.5, self.env_size[0] - 0.5)
            self.ax.set_ylim(-0.5, self.env_size[1] - 0.5)
            self.ax.xaxis.set_ticks(np.arange(-0.5, self.env_size[0], 1))
            self.ax.yaxis.set_ticks(np.arange(-0.5, self.env_size[1], 1))
            self.ax.grid(True, linestyle="-", color="gray", linewidth="1", axis='both')
            self.ax.set_aspect('equal')
            self.ax.invert_yaxis()
            self.ax.xaxis.set_ticks_position('top')

            idx_labels_x = [i for i in range(self.env_size[0])]
            idx_labels_y = [i for i in range(self.env_size[1])]
            for lb in idx_labels_x:
                self.ax.text(lb, -0.75, str(lb+1), size=10, ha='center', va='center', color='black')
            for lb in idx_labels_y:
                self.ax.text(-0.75, lb, str(lb+1), size=10, ha='center', va='center', color='black')
            self.ax.tick_params(bottom=False, left=False, right=False, top=False,
                                labelbottom=False, labelleft=False, labeltop=False)

            self.target_rect = patches.Rectangle(
                (self.target_state[0]-0.5, self.target_state[1]-0.5), 1, 1,
                linewidth=1, edgecolor=self.color_target, facecolor=self.color_target)
            self.ax.add_patch(self.target_rect)

            for forbidden_state in self.forbidden_states:
                rect = patches.Rectangle(
                    (forbidden_state[0]-0.5, forbidden_state[1]-0.5), 1, 1,
                    linewidth=1, edgecolor=self.color_forbid, facecolor=self.color_forbid)
                self.ax.add_patch(rect)

            self.agent_star, = self.ax.plot([], [], marker='*',
                color=self.color_agent, markersize=20, linewidth=0.5)
            self.traj_obj, = self.ax.plot([], [], color=self.color_trajectory, linewidth=0.5)

        # self.agent_circle.center = (self.agent_state[0], self.agent_state[1])
        self.agent_star.set_data([self.agent_state[0]],[self.agent_state[1]])
        traj_x, traj_y = zip(*self.traj)
        self.traj_obj.set_data(traj_x, traj_y)

        plt.draw()
        plt.pause(animation_interval)
        if args.debug:
            input('press Enter to continue...')`;

  const srcPolicy = `    def add_policy(self, policy_matrix):
        for state, state_action_group in enumerate(policy_matrix):
            x = state % self.env_size[0]
            y = state // self.env_size[0]
            for i, action_probability in enumerate(state_action_group):
                if action_probability !=0:
                    dx, dy = self.action_space[i]
                    if (dx, dy) != (0,0):
                        self.ax.add_patch(patches.FancyArrow(
                            x, y, dx=(0.1+action_probability/2)*dx,
                            dy=(0.1+action_probability/2)*dy,
                            color=self.color_policy, width=0.001, head_width=0.05))
                    else:
                        self.ax.add_patch(patches.Circle((x, y), radius=0.07,
                            facecolor=self.color_policy, edgecolor=self.color_policy,
                            linewidth=1, fill=False))

    def add_state_values(self, values, precision=1):
        '''
            values: iterable
        '''
        values = np.round(values, precision)
        for i, value in enumerate(values):
            x = i % self.env_size[0]
            y = i // self.env_size[0]
            self.ax.text(x, y, str(value), ha='center', va='center',
                         fontsize=10, color='black')`;

  const srcArgs = `from typing import Union
import numpy as np
import argparse

parser = argparse.ArgumentParser("Grid World Environment")

## ==================== User settings ====================
# specify the number of columns and rows of the grid world
parser.add_argument("--env-size", type=Union[list, tuple, np.ndarray], default=(5,5) )

# specify the start state
parser.add_argument("--start-state", type=Union[list, tuple, np.ndarray], default=(2,2))

# specify the target state
parser.add_argument("--target-state", type=Union[list, tuple, np.ndarray], default=(4,4))

# sepcify the forbidden states
parser.add_argument("--forbidden-states", type=list, default=[ (2, 1), (3, 3), (1, 3)] )

# sepcify the reward when reaching target
parser.add_argument("--reward-target", type=float, default = 10)

# sepcify the reward when entering into forbidden area
parser.add_argument("--reward-forbidden", type=float, default = -5)

# sepcify the reward for each step
parser.add_argument("--reward-step", type=float, default = -1)
## ==================== End of User settings ====================

## ==================== Advanced Settings ====================
parser.add_argument("--action-space", type=list,
    default=[(0, 1), (1, 0), (0, -1), (-1, 0), (0, 0)] )  # down, right, up, left, stay
parser.add_argument("--debug", type=bool, default=False)
parser.add_argument("--animation-interval", type=float, default = 0.2)
## ==================== End of Advanced settings ====================

args = parser.parse_args()

def validate_environment_parameters(env_size, start_state, target_state, forbidden_states):
    if not (isinstance(env_size, tuple) or isinstance(env_size, list)
            or isinstance(env_size, np.ndarray)) and len(env_size) != 2:
        raise ValueError("Invalid environment size. Expected a tuple (rows, cols).")

    for i in range(2):
        assert start_state[i] < env_size[i]
        assert target_state[i] < env_size[i]
        for j in range(len(forbidden_states)):
            assert forbidden_states[j][i] < env_size[i]

try:
    validate_environment_parameters(args.env_size, args.start_state,
                                    args.target_state, args.forbidden_states)
except ValueError as e:
    print("Error:", e)`;

  const srcMain = `
import sys
sys.path.append("..")
from src.grid_world import GridWorld
import random
import numpy as np

# Example usage:
if __name__ == "__main__":
    env = GridWorld()
    state = env.reset()
    for t in range(1000):
        env.render()
        action = random.choice(env.action_space)
        next_state, reward, done, info = env.step(action)
        print(f"Step: {t}, Action: {action}, "
              f"State: {next_state+(np.array([1,1]))}, Reward: {reward}, Done: {done}")
        # if done:
        #     break

    # Add policy
    policy_matrix=np.random.rand(env.num_states,len(env.action_space))
    policy_matrix /= policy_matrix.sum(axis=1)[:, np.newaxis]  # make the sum of elements in each row to be 1

    env.add_policy(policy_matrix)

    # Add state values
    values = np.random.uniform(0,10,(env.num_states,))
    env.add_state_values(values)

    # Render the environment
    env.render(animation_interval=2)`;

  /* ═══════════ 章节内容 ═══════════ */
  const S = {};

  /* ---- §1.1 网格世界 ---- */
  S['grid-world'] = {
    kicker: 'L1 · §1.1',
    title: { zh: '网格世界：一只机器人要学什么？', en: 'A Grid World Example: What Should a Robot Learn?' },
    blocks: [
      { t: 'p', zh: '想象一个机器人（我们称它为<strong>智能体 agent</strong>）生活在一块方格地板上。它一次次迈步，从一个格子挪进相邻的格子——同一时刻只占一格。<strong>白色格子</strong>可以自由进入，<strong>橙色格子</strong>是禁区（forbidden），还有一格特殊的<strong>目标区</strong>（target）。这本书从头到尾都用这个网格世界讲强化学习：小到任何算法都能在纸面上一步步跑完，又装得下强化学习的全部概念。', en: 'Imagine a robot — we call it the <strong>agent</strong> — living on a grid floor. It moves step by step, occupying exactly one cell at a time. <strong>White cells</strong> are accessible, <strong>orange cells</strong> are forbidden areas, and one special cell is the <strong>target</strong>. This little grid world serves the whole book: small enough that every algorithm can be run by hand, step by step, yet rich enough to carry every reinforcement-learning concept.' },
      { t: 'widget', component: 'grid-intro-lab' },
      { t: 'p', zh: '智能体的目标是什么？书里说得很精确：找到一个"好"的策略（policy），使得<strong>从任何一个初始格子出发</strong>都能到达目标区。而"好"的含义是：不进禁区、不走不必要的弯路、也不去撞边界。', en: 'What is the agent\'s goal? The book states it precisely: find a "good" <strong>policy</strong> that reaches the target <strong>from any initial cell</strong>. "Good" means: without entering forbidden cells, without unnecessary detours, and without colliding with the boundary.' },
      { t: 'p', zh: '关键的一转：如果我们事先知道整张地图，规划一条路只是普通的路径搜索问题——很无聊。这个任务之所以"非平凡"（nontrivial），是因为我们假设智能体<strong>对环境一无所知</strong>：没有地图、没有规则说明书。它只能通过<strong>与环境交互、不断试错（trial and error）</strong>来摸索出好策略。这正是"强化学习"四个字的含义——本章接下来引出的每个概念，都是为它服务的。', en: 'Here is the key twist: if we already knew the map, planning a path would be plain route search — boring. The task becomes <strong>nontrivial</strong> precisely because the agent is assumed to know <strong>nothing about the environment</strong> in advance: no map, no manual. It can only discover a good policy by <strong>interacting with the environment and learning by trial and error</strong>. That is what "reinforcement learning" means — every concept this chapter introduces serves that goal.' },
      { t: 'callout', variant: 'idea', zh: '作业衔接：课程作业把这个例子改成 <strong>4×4 = 16 个状态</strong>：禁区是 s8 与 s10（黄色），目标是 s12（蓝色），奖励设为 r_boundary = −1、r_forbidden = −1、r_target = +1、r_other = 0，折扣率 γ = 0.9。本页网格可以随时切换对照。', en: 'Assignment bridge: the homework resizes this example to a <strong>4×4 = 16-state</strong> grid: forbidden cells s8 and s10 (yellow), target s12 (blue), rewards r_boundary = −1, r_forbidden = −1, r_target = +1, r_other = 0, and discount rate γ = 0.9. Toggle between the two worlds on this page anytime.' },
    ],
  };

  /* ---- §1.2 状态与动作 ---- */
  S['state-action'] = {
    kicker: 'L1 · §1.2',
    title: { zh: '状态与动作：给世界编号', en: 'State and Action: Numbering the World' },
    blocks: [
      { t: 'p', zh: '<strong>状态（state）</strong>描述"智能体此刻相对于环境处于什么状况"。在网格世界里，状况就是位置：机器人站在哪个格子。3×3 有九个格子，因此有九个状态，编号为 s1, s2, …, s9（从左上角起、按行数过去）。全部状态放在一起叫<strong>状态空间（state space）</strong>，记作 S = {s1, …, s9}。', en: 'A <strong>state</strong> describes the agent\'s current status with respect to the environment. In the grid world, the status is simply the location: which cell the robot occupies. Nine cells give nine states, indexed s1, s2, …, s9 (row-major from the top-left). The set of all states is the <strong>state space</strong>, denoted S = {s1, …, s9}.' },
      { t: 'p', zh: '在每个状态，智能体有 <strong>5 个候选动作（action）</strong>：向上 a1、向右 a2、向下 a3、向左 a4、原地不动 a5。全体动作构成<strong>动作空间（action space）</strong> A = {a1, …, a5}。这套编号要记牢：书里所有表格的列序都按它排（老师代码用的是另一套顺序，代码精讲一节会专门对照）。', en: 'At every state the agent has <strong>5 candidate actions</strong>: upward a1, rightward a2, downward a3, leftward a4, and staying still a5. All of them form the <strong>action space</strong> A = {a1, …, a5}. Memorise this numbering: every table in the book orders its columns this way (the teacher\'s code uses a different order — the code walkthrough spells out the difference).' },
      { t: 'widget', component: 'state-action-lab' },
      { t: 'p', zh: '一个自然的想法：边界旁边是不是该删掉会撞墙的动作？比如 s1 在角落，取 a1（上）或 a4（左）都会撞边界，那不如规定 s1 的动作空间 A(s1) = {a2, a3, a5}？书上明确说：<strong>我们不这么做</strong>。本书考虑最一般的情形——每个状态的动作空间都相同，A(si) = A = {a1, …, a5}。撞边界不禁止，而是<strong>用负奖励去惩罚</strong>。如此每个状态的决策结构完全一样，数学上不必为角落和边缘写特判；这也是"用奖励塑造行为"思想的第一次亮相。', en: 'A natural thought: why not delete the actions that hit the wall? At corner s1, taking a1 (up) or a4 (left) collides with the boundary, so why not define A(s1) = {a2, a3, a5}? The book explicitly refuses: we consider the most general case where every state shares the same action space, A(si) = A = {a1, …, a5}. Hitting the boundary is not forbidden — it is <strong>punished with a negative reward</strong>. Every state then shares the same decision structure — no special cases for corners and edges — and this is the first appearance of the core RL idea, "shape behaviour with rewards".' },
    ],
  };

  /* ---- §1.3 状态转移 ---- */
  S['transition'] = {
    kicker: 'L1 · §1.3',
    title: { zh: '状态转移：世界如何回应你', en: 'State Transition: How the World Responds' },
    blocks: [
      { t: 'p', zh: '在状态 s 选择动作 a 后，智能体会移动到某个新状态——这个过程叫<strong>状态转移（state transition）</strong>，记作 <code class="inline">s1 --a2--> s2</code>。有两个情况必须想清楚，书上用两条 ⋄ 专门讨论：', en: 'After choosing action a at state s, the agent lands in some new state — this process is the <strong>state transition</strong>, written <code class="inline">s1 --a2--> s2</code>. Two situations deserve special care; the book devotes two diamond bullets to them:' },
      { t: 'steps', items: [
        { zh: '<strong>撞边界怎么办？</strong>比如在 s1 取 a1（向上）。答案：智能体会被"弹回来"，因为<strong>不可能离开状态空间</strong>。所以 s1 --a1--> s1：哪也没去，白撞一次。', en: '<strong>What if the agent hits the boundary?</strong> E.g. taking a1 (up) at s1. Answer: it bounces back, because it is <strong>impossible to exit the state space</strong>. Hence s1 --a1--> s1: nothing happens, the attempt is wasted.' },
        { zh: '<strong>闯禁区怎么办？</strong>比如在 s5 取 a2（向右），右边是禁区 s6。书上给出两种情形：情形一，禁区<strong>可以进入</strong>，只是会挨罚（s5 --a2--> s6）；情形二，禁区<strong>不可进入</strong>（比如四周有墙），智能体被弹回 s5。', en: '<strong>What if the agent steps into a forbidden cell?</strong> E.g. taking a2 (right) at s5, whose right neighbour s6 is forbidden. The book gives two scenarios: Scenario 1, the forbidden cell is <strong>accessible but penalised</strong> (s5 --a2--> s6); Scenario 2, it is <strong>inaccessible</strong> (say, surrounded by walls) and the agent bounces back to s5.' },
      ]},
      { t: 'callout', variant: 'warn', zh: '<strong>课上与作业在此分叉！</strong>课件第 8 页写明：讲课采用<strong>情形一</strong>（禁区可进入，更一般也更有挑战性）；而<strong>作业采用情形二</strong>（禁区不可进入，尝试即被弹回）。老师给的 <code class="inline">grid_world.py</code> 实现的正是情形二——读代码时不要被书上插图带偏。下面的实验台可以切换两种规则。', en: '<strong>Lecture and assignment diverge here!</strong> Slide 8 states: the lectures adopt Scenario 1 (forbidden cells accessible — more general and challenging), while <strong>the assignments adopt Scenario 2</strong> (forbidden cells inaccessible; attempts bounce back). The teacher\'s <code class="inline">grid_world.py</code> implements Scenario 2 — do not let the book\'s figures mislead you when reading the code. The lab below lets you switch between both rules.' },
      { t: 'widget', component: 'transition-lab' },
      { t: 'p', zh: '整张转移关系可以列成一张大表（书中的 Table 1.1）：行是状态、列是动作，格子里写"走完这一步落在哪"。它很直观，但书上紧接着提醒：<strong>表格只能表达确定性的转移</strong>。更一般的语言是<strong>条件概率</strong>。比如 (s1, a2)：p(s2|s1,a2) = 1，其余 p(si|s1,a2) = 0——"必然到 s2"。假如一阵风吹过网格，a2 这一步可能被吹到 s5，于是 p(s5|s1,a2) > 0：这就是随机（stochastic）转移。本书的网格例子全程使用确定性转移，但数学工具从现在起就按随机情形准备。', en: 'All transitions can be listed as one big table (Table 1.1 in the book): rows are states, columns are actions, and each cell says where the agent lands. Intuitive — but the book immediately warns: <strong>a table can only express deterministic transitions</strong>. The general language is <strong>conditional probability</strong>. For (s1, a2): p(s2|s1,a2) = 1 and p(si|s1,a2) = 0 otherwise — "certainly lands in s2". If wind gusts blow across the grid, taking a2 might blow the agent to s5, giving p(s5|s1,a2) > 0: a stochastic transition. The book\'s grid examples stay deterministic throughout, but the mathematical machinery is prepared for the stochastic case from now on.' },
      { t: 'formula', lbl: '条件概率描述转移 · Transition as conditional probability',
        html: 'p(s′|s, a), &nbsp; with &nbsp; <span class="mt">Σ<sub>s′∈S</sub> p(s′|s, a) = 1</span> &nbsp; for every (s, a)' },
    ],
  };

  /* ---- §1.4 策略 ---- */
  S['policy'] = {
    kicker: 'L1 · §1.4',
    title: { zh: '策略：给每个格子发一张指令卡', en: 'Policy: One Instruction Card per Cell' },
    blocks: [
      { t: 'p', zh: '<strong>策略（policy）</strong>回答的问题是"在每个状态该做什么"。直觉的画法就是书上 Figure 1.4 那样：在每个格子里画一支箭头，指向该状态下要采取的动作。沿策略走，从任何初始状态出发都能得到一条<strong>轨迹（trajectory）</strong>。注意：策略是"每个状态都有定义"的全场指令表，不是一条固定路径——起点不同，走出的轨迹就不同，但指令卡是同一套。', en: 'A <strong>policy</strong> answers "what to do at each state". Intuitively it is drawn as in Figure 1.4: one arrow per cell indicating the action to take there. Following a policy from any initial state produces a <strong>trajectory</strong>. Note that a policy is a full instruction sheet defined at <em>every</em> state, not a single fixed path — different starting points yield different trajectories, yet the instruction sheet is the same.' },
      { t: 'p', zh: '数学上，策略写成<strong>条件概率</strong> π(a|s)：在状态 s 选动作 a 的概率。上图这种"一格一箭头"的策略是<strong>确定性的（deterministic）</strong>：以 s1 为例，π(a2|s1) = 1，其余为 0。而<strong>随机策略（stochastic policy）</strong>允许掷骰子：Figure 1.5 里 s1 以 0.5 的概率向右、0.5 的概率向下。随机策略同样可以存成表（Table 1.2）——第 i 行第 j 列就是在状态 si 取动作 aj 的概率，每行加起来必须是 1。到第 9 章我们还会学第三种表示：参数化函数。', en: 'Mathematically a policy is written as <strong>conditional probabilities</strong> π(a|s): the probability of choosing action a in state s. The one-arrow-per-cell policy is <strong>deterministic</strong>: e.g. at s1, π(a2|s1) = 1 and all others are 0. A <strong>stochastic policy</strong> rolls dice: in Figure 1.5 state s1 goes rightward with 0.5 and downward with 0.5. Stochastic policies are stored as tables too (Table 1.2) — entry (i, j) is the probability of taking aj at si, and each row must sum to 1. A third representation, parameterised functions, arrives in Chapter 9.' },
      { t: 'widget', component: 'policy-lab' },
      { t: 'formula', lbl: '策略的数学形式 · Policy as conditional probability',
        html: 'π(a|s), &nbsp; with &nbsp; <span class="mt">Σ<sub>a∈A(s)</sub> π(a|s) = 1</span> &nbsp; for every s ∈ S' },
      { t: 'callout', variant: 'key', zh: '为什么用概率这么"绕"的方式描述策略？两个理由：① <strong>通用性</strong>——确定性只是概率为 1 的特例，一套记号通吃两类策略；② <strong>为学习做准备</strong>——后面章节里策略会被不断微调，"把概率从 0.5 挪到 0.7"这种渐进修改，比"换一支箭头"好写得多。', en: 'Why describe policies with probabilities? Two reasons. First, <strong>generality</strong> — deterministic is just the special case of probability 1, so one notation covers both kinds. Second, <strong>readiness for learning</strong> — later chapters keep nudging policies, and "move probability from 0.5 to 0.7" is a much smoother update than "swap an arrow".' },
    ],
  };

  /* ---- §1.5 奖励 ---- */
  S['reward'] = {
    kicker: 'L1 · §1.5',
    title: { zh: '奖励：牵住机器人的缰绳', en: 'Reward: The Reins That Guide the Robot' },
    blocks: [
      { t: 'p', zh: '执行一个动作后，环境会立刻给智能体一个反馈数——<strong>奖励（reward）</strong> r。它被看作状态和动作的函数 r(s, a)，可以是正、负或零。<strong>正奖励鼓励</strong>这个动作被再选，<strong>负奖励劝阻</strong>它。奖励是强化学习里最独特的概念：它是我们人类对机器人的全部"说教方式"。书里把网格世界的奖励定为四条：', en: 'After executing an action, the environment immediately hands the agent a feedback number — the <strong>reward</strong> r. It is treated as a function of state and action, r(s, a), and may be positive, negative or zero. <strong>Positive rewards encourage</strong> the action; <strong>negative rewards discourage</strong> it. Reward is RL\'s most distinctive concept: it is the only "lecturing" we humans give the robot. The book fixes four rules for the grid world:' },
      { t: 'steps', items: [
        { zh: '试图越界：r<sub>boundary</sub> = −1（撞墙挨罚）。', en: 'Attempting to exit the boundary: r<sub>boundary</sub> = −1 (bumping is punished).' },
        { zh: '试图进禁区：r<sub>forbidden</sub> = −1（闯禁区挨罚）。', en: 'Attempting to enter a forbidden cell: r<sub>forbidden</sub> = −1.' },
        { zh: '到达目标：r<sub>target</sub> = +1（到达有奖）。', en: 'Reaching the target: r<sub>target</sub> = +1.' },
        { zh: '其他普通移动：r<sub>other</sub> = 0（走路不花钱——注意这个设定，后面会比较）。', en: 'Any other move: r<sub>other</sub> = 0 (walking is free — keep this in mind for later).' },
      ]},
      { t: 'widget', component: 'reward-lab' },
      { t: 'p', zh: '目标格 s9 值得特殊关照：<strong>过程到达 s9 后并不终止</strong>。在 s9 取 a5（原地），下一状态还是 s9，奖励 +1——原地领奖；取 a2（向右）？下一状态仍是 s9（被边界弹回），但奖励是 r_boundary = −1。同一个格子，不同动作，奖励天差地别。书上还强调：奖励是一层<strong>人机接口（human–machine interface）</strong>——四个数字（−1、−1、+1、0）就表达了"别撞墙、别闯禁区、去目标"的全部意图。设计奖励需要把任务吃透，但仍远比亲自替机器人把题解出来容易。', en: 'The target s9 deserves special attention: <strong>the process does not terminate upon arrival</strong>. Taking a5 (still) at s9 keeps the agent at s9 with reward +1 — collecting the prize in place. Taking a2 (right)? The next state is still s9 (bounced by the boundary), but the reward is r_boundary = −1. Same cell, different action, wildly different feedback. The book also frames reward as a <strong>human–machine interface</strong>: four numbers (−1, −1, +1, 0) express the whole intent — "avoid walls, avoid forbidden cells, reach the target". Designing them demands a thorough grasp of the task, yet remains far easier than solving the task for the robot.' },
      { t: 'callout', variant: 'danger', zh: '<strong>新手必踩的坑：能不能只看即时奖励选动作？</strong>比如拿到奖励表后，每个格子都选当前奖励最高的动作？书上的回答斩钉截铁：不行。奖励表里都是<strong>即时奖励（immediate reward）</strong>，而好策略要求<strong>长期总奖励</strong>最大。一个即时奖励为负的动作（比如绕路）可能换来后面的大正奖励；一个即时奖励为 0 的"顺手"动作可能把你引进禁区。短视必亏——这正是下一节"回报"概念要登场的原因。', en: '<strong>A trap every beginner falls into: can we just chase the immediate reward?</strong> Given the reward table, why not always pick the best-rewarded action at each state? The book\'s answer is a firm no. The table lists <strong>immediate</strong> rewards only, while a good policy must maximise the <strong>total reward in the long run</strong>. An action with negative immediate reward (a detour) may unlock a big future prize; a convenient zero-reward move may walk you into a forbidden cell. Short-sightedness loses — which is why the next section introduces the "return".' },
      { t: 'p', zh: '和状态转移一样，奖励表只覆盖确定性情形；一般情形用条件概率 p(r|s, a) 描述。例如 (s1, a1)：p(r = −1|s1, a1) = 1、p(r ≠ −1|s1, a1) = 0——必然挨 −1。奖励过程当然也可以随机（书里的例子：努力学习通常有正奖励，但考多少分有运气成分）。', en: 'As with transitions, the reward table only covers the deterministic case; the general description is the conditional probability p(r|s, a). For example (s1, a1): p(r = −1|s1, a1) = 1 and p(r ≠ −1|s1, a1) = 0 — certain punishment. Reward can also be stochastic (the book\'s example: studying hard usually earns positive reward, but the exact grade has luck in it).' },
    ],
  };

  /* ---- §1.6 轨迹/回报/回合 ---- */
  S['trajectory'] = {
    kicker: 'L1 · §1.6',
    title: { zh: '轨迹、回报与回合：把时间加起来', en: 'Trajectories, Returns, and Episodes: Adding Up Time' },
    blocks: [
      { t: 'p', zh: '<strong>轨迹（trajectory）</strong>就是一条"状态-动作-奖励"链。书上摆了两条：策略 1 从 s1 出发走 <code class="inline">s1 →a2→ s2 →a3→ s5 →a3→ s8 →a2→ s9</code>，沿途奖励 0, 0, 0, +1；策略 2 从 s1 出发走 <code class="inline">s1 →a3→ s4 →a3→ s7 →a2→ s8 →a2→ s9</code>，沿途奖励 0, −1, 0, +1（它踩进了禁区 s7）。<strong>回报（return）</strong>定义为轨迹上全部奖励之和——也叫总奖励或累积奖励。策略 1 的回报 = 0+0+0+1 = <strong>1</strong>；策略 2 的回报 = 0−1+0+1 = <strong>0</strong>。', en: 'A <strong>trajectory</strong> is a chain of state-action-reward triples. The book lines up two of them: Policy 1 walks <code class="inline">s1 →a2→ s2 →a3→ s5 →a3→ s8 →a2→ s9</code> collecting 0, 0, 0, +1; Policy 2 walks <code class="inline">s1 →a3→ s4 →a3→ s7 →a2→ s8 →a2→ s9</code> collecting 0, −1, 0, +1 (it steps into forbidden s7). The <strong>return</strong> is defined as the sum of all rewards along the trajectory — also called total or cumulative reward. Policy 1: 0+0+0+1 = <strong>1</strong>. Policy 2: 0−1+0+1 = <strong>0</strong>.' },
      { t: 'p', zh: '于是"哪条策略好"从口味问题变成了数学问题：<strong>1 > 0，策略 1 更好</strong>。这个结论和我们的直觉完全一致（策略 2 闯了禁区），但注意——现在是<strong>算出来的</strong>，不是感觉出来的。回报就是评价策略的尺子。', en: 'Suddenly "which policy is better" stops being a matter of taste: <strong>1 > 0, Policy 1 wins</strong>. The conclusion matches our intuition (Policy 2 trespassed), but notice — it is now <strong>computed</strong>, not felt. Return is the ruler for judging policies.' },
      { t: 'widget', component: 'trajectory-lab' },
      { t: 'p', zh: '回报 = <strong>即时奖励 + 未来奖励</strong>。即时奖励是此刻这一步拿到的，未来奖励是离开当前状态之后拿到的全部。即时奖励为负、未来为正是完全可能的——所以选动作必须看回报（总量），不能只看即时。', en: 'A return consists of an <strong>immediate reward plus future rewards</strong>. The immediate one comes from the current step; the future ones arrive after leaving the current state. Negative-now-positive-later is entirely possible — so decisions must be made on the return (the total), never on the immediate reward alone.' },
      { t: 'p', zh: '<strong>无限长轨迹与折扣。</strong>到达 s9 后过程其实不必停——策略在 s9 上仍有定义。若规定到 s9 后一直取 a5，轨迹就变成 s1→s2→s5→s8→s9→s9→s9→…，奖励流 0,0,0,1,1,1,…。直接求和：return = ∞，<strong>发散了，定义失效</strong>。解决办法是给未来的奖励打折扣：<strong>折扣回报（discounted return）</strong>= 0 + γ·0 + γ²·0 + γ³·1 + γ⁴·1 + …，其中 <strong>γ ∈ (0,1)</strong> 叫<strong>折扣率（discount rate）</strong>。', en: '<strong>Infinite trajectories and discounting.</strong> Reaching s9 does not have to end the process — the policy is still defined there. If the agent keeps taking a5 at s9, the trajectory becomes s1→s2→s5→s8→s9→s9→… with reward stream 0,0,0,1,1,1,…. Summing directly: return = ∞ — <strong>divergent, definition broken</strong>. The fix is to discount the future: the <strong>discounted return</strong> = 0 + γ·0 + γ²·0 + γ³·1 + γ⁴·1 + …, where <strong>γ ∈ (0,1)</strong> is the <strong>discount rate</strong>.' },
      { t: 'formula', lbl: '几何级数求和 · Geometric-series sum',
        html: 'discounted return = γ³(1 + γ + γ² + …) = <span class="frac"><span>γ³</span><span>1 − γ</span></span>' },
      { t: 'p', zh: '这个 1/(1−γ) 是整本书出现频率最高的无穷级数：公比 |γ| < 1 时等比级数收敛于 1/(1−公比)。引入折扣率一举两得：① <strong>无限轨迹的回报也有限</strong>，不必再人为规定什么时候停下；② <strong>拿到一枚远近权衡的旋钮</strong>——γ 接近 0，智能体几乎只看眼前；γ 接近 1，未来几乎不打折，智能体敢为长期利益吃眼前的亏。第 3.5 节会摆出几种 γ 下的最优策略，让你亲眼看到差别。', en: 'This 1/(1−γ) is the most frequent infinite series in the whole book: a geometric series with ratio |γ| < 1 converges to 1/(1−ratio). Introducing γ pays twice: ① <strong>infinite trajectories now earn finite returns</strong>, so no artificial stopping rule is needed; ② it <strong>dials near- against far-sightedness</strong> — γ near 0 and the agent lives in the present; γ near 1 and it will suffer now for later gains. Section 3.5 lays out optimal policies under several γ values so you can judge the difference yourself.' },
      { t: 'p', zh: '<strong>回合（episode）。</strong>沿策略交互时若在某个终止状态停下，得到的轨迹叫一个<strong>回合</strong>（也叫 trial）。有终止状态的任务叫 <strong>episodic 任务</strong>；永不停止的叫 <strong>continuing 任务</strong>。妙的是书上展示了两者可以<strong>统一处理</strong>——把 episodic 任务改造成 continuing：到达终止状态后有两种续法。', en: '<strong>Episodes.</strong> If the interaction stops at some terminal state, the resulting trajectory is an <strong>episode</strong> (or trial). Tasks with episodes are <strong>episodic tasks</strong>; never-ending ones are <strong>continuing tasks</strong>. The book then shows the two can be <strong>treated in a unified way</strong> — by converting episodic tasks into continuing ones. After reaching the terminal state there are two ways to continue:' },
      { t: 'steps', items: [
        { zh: '<strong>吸收态（absorbing state）</strong>：把终止状态当作特殊状态，专门设计它的动作空间或转移，使智能体永远留在里面。例如 A(s9) = {a5}，或保留五个动作但令 p(s9|s9, ai) = 1 对所有 i 成立。', en: '<strong>Absorbing state</strong>: treat the terminal state as special and design its action space or transitions so the agent stays forever — e.g. A(s9) = {a5}, or keep all five actions but set p(s9|s9, ai) = 1 for all i.' },
        { zh: '<strong>普通状态</strong>：把 s9 当普通格子，动作空间照旧，智能体可以离开再回来。因为每次到达 s9 都拿 +1，智能体最终会自己学会"赖在 s9 不走"来收集奖励。注意：此时轨迹无限长且奖励为正，<strong>必须用折扣率</strong>否则回报发散。', en: '<strong>Normal state</strong>: treat s9 like any other cell with the full action space; the agent may leave and come back. Since each arrival earns +1, the agent will eventually learn to stay at s9 by itself to collect rewards. Note: the trajectory is now infinite with positive reward, so a <strong>discount rate is mandatory</strong> or the return diverges.' },
      ]},
      { t: 'callout', variant: 'key', zh: '本书采用第二种：目标格就是普通状态，A(s9) = {a1, …, a5}。老师的 <code class="inline">grid_world.py</code> 也是这么写的——<code class="inline">_is_done</code> 只是报告"到过目标"，环境本身永不关机。', en: 'The book adopts the second way: the target is a normal state with A(s9) = {a1, …, a5}. The teacher\'s <code class="inline">grid_world.py</code> does the same — <code class="inline">_is_done</code> merely reports "visited the target"; the environment itself never shuts down.' },
    ],
  };

  /* ---- §1.7 MDP ---- */
  S['mdp'] = {
    kicker: 'L1 · §1.7',
    title: { zh: '马尔可夫决策过程：给概念上户口', en: 'Markov Decision Processes: Registering the Concepts' },
    blocks: [
      { t: 'p', zh: '前几节用例子把概念全部"摸"了一遍，这一节做形式化收编：把它们装进<strong>马尔可夫决策过程（Markov Decision Process, MDP）</strong>。MDP 是描述<strong>随机动态系统</strong>的通用数学框架，四组 ingredients（原料）如下：', en: 'The previous sections felt every concept through examples; this one formalises them into a <strong>Markov Decision Process (MDP)</strong> — a general framework for <strong>stochastic dynamical systems</strong>, assembled from four groups of ingredients:' },
      { t: 'steps', items: [
        { zh: '<strong>集合 Sets</strong>：状态空间 S；每个状态的动作空间 A(s)；每个 (s,a) 对应的奖励集合 R(s,a)。', en: '<strong>Sets</strong>: the state space S; the action space A(s) for each state; the reward set R(s,a) for each pair (s,a).' },
        { zh: '<strong>模型 Model</strong>（也叫 dynamics 动力学）：转移概率 p(s′|s,a)——在 s 取 a 落到 s′ 的概率，对每个 (s,a) 有 Σ p(s′|s,a) = 1；奖励概率 p(r|s,a)——取 a 得 r 的概率，同样归一化。', en: '<strong>Model</strong> (a.k.a. the dynamics): the transition probability p(s′|s,a) with Σ p(s′|s,a) = 1 for every (s,a); and the reward probability p(r|s,a), likewise normalised.' },
        { zh: '<strong>策略 Policy</strong>：π(a|s)，在 s 选 a 的概率，Σ_a π(a|s) = 1。', en: '<strong>Policy</strong>: π(a|s), the probability of choosing a at s, summing to 1 over a.' },
        { zh: '<strong>马尔可夫性 Markov property</strong>：无记忆性。数学上即式 (1.4)——下一步的状态与奖励只取决于当前的 s、a，与更早的历史无关。', en: '<strong>Markov property</strong>: memorylessness. Mathematically Equation (1.4): the next state and reward depend only on the current s and a, not on earlier history.' },
      ]},
      { t: 'widget', component: 'mdp-lab' },
      { t: 'formula', lbl: '马尔可夫性 · Markov property — Eq. (1.4)',
        html: 'p(s<sub>t+1</sub>|s<sub>t</sub>, a<sub>t</sub>, s<sub>t−1</sub>, a<sub>t−1</sub>, …, s<sub>0</sub>, a<sub>0</sub>) = p(s<sub>t+1</sub>|s<sub>t</sub>, a<sub>t</sub>)<br>p(r<sub>t+1</sub>|s<sub>t</sub>, a<sub>t</sub>, s<sub>t−1</sub>, a<sub>t−1</sub>, …, s<sub>0</sub>, a<sub>0</sub>) = p(r<sub>t+1</sub>|s<sub>t</sub>, a<sub>t</sub>)' },
      { t: 'p', zh: '模型还分<strong>平稳（stationary）</strong>与非平稳（nonstationary）：平稳模型的规律不随时间变；如果禁区会随机出现或消失，模型就是非平稳的。本书只考虑平稳模型。p(s′|s,a) 与 p(r|s,a) 合起来叫 <strong>model（模型）</strong>——第 4 章"有模型"方法和第 5 章起"无模型"方法的分水岭就是：你手里到底有没有这两组概率。', en: 'Models are <strong>stationary</strong> or nonstationary: a stationary model\'s rules do not change over time; forbidden areas that pop up and vanish would make it nonstationary. This book considers stationary models only. The pair p(s′|s,a) and p(r|s,a) together is called the <strong>model</strong> — and whether you possess these probabilities is exactly the watershed between model-based methods (Chapter 4) and model-free ones (Chapter 5 onwards).' },
      { t: 'p', zh: '<strong>MDP 与 MP 的关系。</strong>你可能听过马尔可夫过程（MP）/马尔可夫链。关系一句话：<strong>策略一旦固定，MDP 就退化成 MP</strong>。因为"下一步去哪"本来由 (s, a) 联合决定；把 a 的选择也固定进概率里，世界就只剩一条带概率的游走。下面的实验台把网格世界按 Table 1.2 的随机策略抽象成马尔可夫链，放一个粒子进去游走感受一下。', en: '<strong>MDP vs. MP.</strong> You may have met the Markov process (MP) / Markov chain before. The relationship in one sentence: <strong>once the policy is fixed, the MDP degenerates into an MP</strong> — the next step was jointly decided by (s, a); fix how a is chosen and the world reduces to a probabilistic walk. The lab below abstracts the grid world into a Markov chain under the stochastic policy of Table 1.2 — release a particle and watch it wander.' },
      { t: 'widget', component: 'mp-lab' },
      { t: 'p', zh: '最后回到最朴素的图像：<strong>强化学习 = 智能体与环境的交互循环</strong>。智能体是决策者：感知状态、维护策略、执行动作；智能体之外的一切都是环境。动作由执行器落地，状态因此改变、奖励随之产生，解释器把它们翻译给智能体——闭环就此形成。这张循环图是全书所有算法的"物理底盘"，后面每一种算法都只是在改变循环里智能体那一侧的思考方式。', en: 'Finally, back to the plainest picture: <strong>RL = an agent–environment interaction loop</strong>. The agent is the decision-maker: it senses the state, maintains a policy, and executes actions; everything outside it is the environment. An actuator carries out the decision, the state changes, a reward is produced, and interpreters translate both back to the agent — the loop closes. This diagram is the physical chassis of every algorithm in the book; each later method only changes how the agent thinks on its side of the loop.' },
    ],
  };

  /* ---- §1.8 总结 ---- */
  S['summary'] = {
    kicker: 'L1 · §1.8',
    title: { zh: '本章总结：概念之间的关系链', en: 'Chapter Summary: How the Concepts Chain Together' },
    blocks: [
      { t: 'p', zh: '第一章没有算法，却给出了全书所有算法赖以站立的地基。把概念按"依赖顺序"串成一条链，就是下面的概念链——从网格世界出发，一路推到 MDP。建议从左到右点一遍，检验每个环节自己是否能独立复述。', en: 'Chapter 1 contains no algorithm, yet it lays the foundation every later algorithm stands on. Stringing the concepts in dependency order gives the chain below — from the grid world all the way to the MDP. Walk it left to right and check you can restate each link on your own.' },
      { t: 'widget', component: 'concept-chain' },
      { t: 'p', zh: '一句话总结每个概念：状态是"我在哪"，动作是"我能做什么"，转移是"世界怎么回应"，策略是"我的行为准则"，奖励是"环境的即时报酬"，轨迹是"一段经历"，回报是"这段经历的总分"，折扣率是"未来在今天的汇率"，回合是"一段完整经历"，MDP 是把这一切装进一个数学框架，马尔可夫性是框架的地基。', en: 'One line per concept: the state is "where am I", the action is "what can I do", the transition is "how the world responds", the policy is "my code of conduct", the reward is "the environment\'s instant payment", the trajectory is "an experience", the return is "the experience\'s total score", the discount rate is "today\'s exchange rate for the future", an episode is "one complete experience", and the MDP is the mathematical frame that holds them all — with the Markov property as its bedrock.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：有了"回报"这个尺子，自然会问——能不能在某个状态 s 就预先估计"从这里出发按策略 π 走，平均能拿多少回报"？这个量叫<strong>状态价值（state value）</strong>，计算它的方程是 <strong>Bellman 方程</strong>——第 2 章的主角。', en: 'Next lecture teaser: with "return" as the ruler, a natural question arises — can we estimate in advance, while standing at state s, how much return the policy π will collect on average from here? That quantity is the <strong>state value</strong>, and the equation that computes it — the <strong>Bellman equation</strong> — is the protagonist of Chapter 2.' },
    ],
  };

  /* ---- 代码精讲 ---- */
  S['code'] = {
    kicker: 'L1 · 动手 · Hands-on',
    title: { zh: '代码精讲：逐类型拆解 grid_world.py', en: 'Code Walkthrough: grid_world.py Piece by Piece, Type by Type' },
    blocks: [
      { t: 'p', zh: '老师的代码只有 160 行，却是一个完整的强化学习环境（gym 风格接口）。这一节按"先类型、后流程"精讲：先认识代码里出现的每一种 <strong>Python 类型</strong>，再顺着"构造 → 交互 → 绘图"的顺序拆每个方法。看完这一节，作业里的每行代码你都应该能说出它在干什么、为什么这么写。', en: 'The teacher\'s code is only ~160 lines, yet it is a complete RL environment (gym-style interface). This section explains it "types first, then flow": first meet every <strong>Python type</strong> that appears, then dissect each method along "construct → interact → draw". After this section, you should be able to narrate every line of the assignment code.' },
      { t: 'widget', component: 'type-chips' },
      { t: 'p', zh: '<strong>先解决一个最吵的困惑：动作顺序。</strong>书本编号是 a1上、a2右、a3下、a4左、a5原地；而 <code class="inline">arguments.py</code> 里 <code class="inline">action_space = [(0,1), (1,0), (0,-1), (-1,0), (0,0)]</code>，注释写明顺序是 <strong>down, right, up, left, stay</strong>（下、右、上、左、原地）。两套是"同一组动作、不同排列"：写作业的策略矩阵时，<strong>列顺序必须跟代码走</strong>（第 1 列是"下"而不是书上定义的 a1"上"），否则画出来的箭头会全体转 90 度。坐标则是代码系 (x, y)：x 向右、y 向下，与书上的行列编号满足 s_i ↔ (x, y) = ((i−1)%n, (i−1)//n)。', en: '<strong>First, settle the loudest confusion: the action order.</strong> The book numbers a1 up, a2 right, a3 down, a4 left, a5 still; but <code class="inline">arguments.py</code> defines <code class="inline">action_space = [(0,1), (1,0), (0,-1), (-1,0), (0,0)]</code> whose comment reads <strong>down, right, up, left, stay</strong>. Same five actions, different ordering: when writing the assignment\'s policy matrix, <strong>the column order must follow the code</strong> (column 1 is "down", not the book\'s a1 "up"), or every arrow will point 90° off. Coordinates use the code frame (x, y): x rightward, y downward, related to the book\'s state index by s_i ↔ (x, y) = ((i−1)%n, (i−1)//n).' },
      { t: 'widget', component: 'code-lab' },
      { t: 'callout', variant: 'warn', zh: '<strong>边界反弹的奖励细节。</strong><code class="inline">_get_next_state_and_reward</code> 里四个撞边界分支给的奖励是 <code class="inline">reward_forbidden</code> 而不是一个单独的 <code class="inline">reward_boundary</code>——老师把"撞墙"当成一种"被禁止的行为"。作业恰好规定 r_boundary = r_forbidden = −1，所以数值上无差别；但如果哪天想让两种惩罚不同，就得先在这里拆开两个变量。', en: '<strong>A reward detail in the bounce logic.</strong> The four boundary branches in <code class="inline">_get_next_state_and_reward</code> return <code class="inline">reward_forbidden</code> rather than a separate <code class="inline">reward_boundary</code> — the teacher treats "hitting the wall" as one kind of "forbidden behaviour". The assignment happens to set r_boundary = r_forbidden = −1 so numerically nothing differs; but if the two punishments ever need to diverge, these variables must be split first.' },
      { t: 'callout', variant: 'danger', zh: '<strong>三个高频坑。</strong>① <code class="inline">plt.pause(0)</code> 在无窗口的 Agg 后端下会<strong>永久卡死</strong>——保存图片时把它换成微小间隔或直接空函数；② <code class="inline">add_policy</code> / <code class="inline">add_state_values</code> 必须在 <code class="inline">render()</code> 之后调用，否则 <code class="inline">self.ax</code> 还不存在，直接 AttributeError；③ "原地"动作在策略图里画成<strong>小圆圈</strong>不是箭头，看到圆圈别以为画错了。', en: '<strong>Three frequent traps.</strong> ① <code class="inline">plt.pause(0)</code> <strong>hangs forever</strong> under the windowless Agg backend — use a tiny interval or a no-op when saving figures; ② <code class="inline">add_policy</code> / <code class="inline">add_state_values</code> must be called <strong>after</strong> <code class="inline">render()</code>, or <code class="inline">self.ax</code> does not exist yet and raises AttributeError; ③ the "stay" action is drawn as a <strong>small circle</strong>, not an arrow — a circle in the policy plot is not a bug.' },
    ],
  };

  /* ---- 长推理 ---- */
  S['reasoning'] = {
    kicker: 'L1 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：从一个格子走到 MDP', en: 'The Long Coherent Reasoning: From One Cell to the MDP' },
    blocks: [
      { t: 'p', zh: '这一节把全章重构成<strong>一条不许断的逻辑链</strong>：每一步只回答一个问题，并且答案必须逼出下一步的问题。不要跳步——强化学习的所有困惑，几乎都源于跳过了其中某一环。点击"下一步推理"逐步展开；读完后可切换"连贯全文"模式看整条推理一口气连读。', en: 'This section rebuilds the whole chapter as <strong>one unbreakable logical chain</strong>: each step answers exactly one question, and its answer must force the next question. Do not skip — nearly all confusion in RL comes from a skipped link. Unfold it with "Next step"; afterwards switch to "continuous essay" mode to read the entire reasoning in one breath.' },
      { t: 'widget', component: 'reasoning-lab' },
    ],
  };

  /* ---- Q&A ---- */
  S['qa'] = {
    kicker: 'L1 · §1.9',
    title: { zh: '问答：两个高频疑问', en: 'Q&A: Two Frequently Asked Questions' },
    blocks: [
      { t: 'p', zh: '书以两个问答收尾，问的都是初学者最容易犯嘀咕的地方。点击卡片翻面看答案；第三张是本站补充——读老师代码时最常见的疑惑。', en: 'The book closes with two questions every beginner asks. Click a card to flip it; the third card is our addition — the most common confusion when reading the teacher\'s code.' },
      { t: 'widget', component: 'qa-lab' },
    ],
  };

  /* ═══════════ 长推理链数据 ═══════════ */
  const reasoning = [
    { link: '起点 · The starting point',
      title: { zh: '我们到底要什么？', en: 'What do we actually want?' },
      zh: '任务：从任意格子出发都到达目标，不闯禁区、不绕路、不撞墙。"好策略"目前只是直觉。要让机器能"求"出好策略，必须先把"好"变成一个<strong>可以计算的数</strong>——数学的第一原则：想优化什么，就先给什么下定义。',
      en: 'The task: reach the target from any cell, without trespassing, detouring, or hitting walls. "Good policy" is so far just intuition. For a machine to compute a good policy, "good" must become a <strong>computable number</strong> — the first principle of mathematics: to optimise something, define it first.',
      question: '用什么数来衡量一个策略的好坏？' },
    { link: '因为 → 所以 · Therefore',
      title: { zh: '先看手上有什么：即时奖励 r(s,a)', en: 'Start from what we have: the immediate reward r(s,a)' },
      zh: '环境每步只给一个即时奖励：撞墙/闯禁区 −1，到目标 +1，其他 0。能不能贪心地"每步选即时奖励最高的动作"？不能——反例随手可得：一个即时奖励为 0 的绕行能避开 −1 的禁区，贪心却会一头扎进去。即时奖励只描述"这一步"，不描述"这一生"。',
      en: 'Each step the environment hands one immediate reward: −1 for walls/forbidden cells, +1 for the target, 0 otherwise. Can we greedily pick the best immediate action each step? No — counterexamples are everywhere: a detour of 0-reward steps may avoid a −1 forbidden cell into which greed would happily walk. The immediate reward describes this step, not the whole life.',
      question: '单步不够，那什么才够？' },
    { link: '所以 · Hence',
      title: { zh: '把整条轨迹的奖励加起来：回报', en: 'Sum the whole trajectory: the return' },
      zh: '轨迹 = 状态-动作-奖励链：s1 →a2→ s2 →a3→ s5 →a3→ s8 →a2→ s9，奖励 0,0,0,+1。<strong>回报 = 沿途奖励之和</strong>。策略 1 回报 = 1，策略 2（闯禁区）回报 = 0，1 > 0，与直觉一致——但这次是算出来的。尺子造好了：回报可以评价策略。',
      en: 'A trajectory is a state-action-reward chain: s1 →a2→ s2 →a3→ s5 →a3→ s8 →a2→ s9 with rewards 0,0,0,+1. The <strong>return = sum of rewards along the way</strong>. Policy 1 earns 1; Policy 2 (trespassing) earns 0; 1 > 0, matching intuition — but now computed. The ruler exists: return judges policies.',
      question: '这把尺子永远可用吗？' },
    { link: '但是 · But',
      title: { zh: '轨迹可以无限长：回报发散了', en: 'Trajectories can be infinite: the return diverges' },
      zh: '到达 s9 后过程不必停：在 s9 取 a5原地，下一步仍是 s9，奖励 +1。于是轨迹 s9→s9→s9→… 带来 1+1+1+…，总回报 = ∞。<strong>发散的数没法比较大小</strong>——尺子在无限任务上失效了。这解释了为什么书上要引入"continuing 任务"这个概念。',
      en: 'Reaching s9 need not stop the process: taking a5 there keeps the agent at s9 earning +1 forever. The trajectory s9→s9→… yields 1+1+1+…, total = ∞. <strong>Divergent numbers cannot be compared</strong> — the ruler fails on infinite tasks. This is exactly why RL needs the notion of continuing tasks.',
      question: '怎样让无限和收敛？' },
    { link: '解决办法 · The fix',
      title: { zh: '给未来打折扣：折扣率 γ', en: 'Discount the future: the discount rate γ' },
      zh: '让第 k 步后的奖励只值 γᵏ 倍，γ ∈ (0,1)。总回报 = Σ γᵏ r_{k+1}。对 0,0,0,1,1,1,…：折扣回报 = γ³ + γ⁴ + γ⁵ + … = γ³(1+γ+γ²+…)。<strong>几何级数</strong>：公比 γ < 1 时 1+γ+γ²+… = 1/(1−γ)，所以折扣回报 = <strong>γ³/(1−γ)</strong>——有限了！定义被修复，且对任何奖励流都收敛（奖励有界时）。',
      en: 'Let a reward k steps ahead count only γᵏ times, γ ∈ (0,1). Return = Σ γᵏ r_{k+1}. For 0,0,0,1,1,1,…: discounted return = γ³ + γ⁴ + … = γ³(1+γ+γ²+…). A <strong>geometric series</strong> with ratio γ < 1 sums to 1/(1−γ), so the discounted return = <strong>γ³/(1−γ)</strong> — finite! The definition is repaired and converges for any bounded reward stream.',
      question: 'γ 只是数学补丁吗？' },
    { link: '更进一步 · Moreover',
      title: { zh: 'γ 是行为旋钮：近视与远视', en: 'γ is a behaviour dial: short-sighted vs. far-sighted' },
      zh: 'γ→0：远期奖励近乎清零，智能体只顾眼前——短视；γ→1：未来几乎不打折，智能体愿意为长期利益忍受眼前的 −1——远视、敢冒险。同一个任务，拧 γ 就能得到"保守"到"冒险"连续谱上的各种最优行为。γ 同时解决了收敛与权衡两个问题——这是它成为 RL 超参数常客的原因（作业里 γ = 0.9）。',
      en: 'γ→0: distant rewards vanish, the agent only cares about now — short-sighted. γ→1: the future barely discounts, the agent tolerates a −1 today for tomorrow\'s +1 — far-sighted, risk-taking. One dial sweeps optimal behaviours from conservative to adventurous. γ solves convergence and trade-off at once — hence its place among the standard hyperparameters (the assignment uses γ = 0.9).',
      question: 'episodic 任务怎么办，也要无限走下去吗？' },
    { link: '统一框架 · Unification',
      title: { zh: '把"会结束"的任务也当成"永不结束"', en: 'Treat "ending" tasks as never-ending' },
      zh: 'Episodic（有终局）与 continuing（无终局）任务可以统一：到 s9 后要么把它造成<strong>吸收态</strong>（只许 a5，或 p(s9|s9,ai)=1），要么当<strong>普通状态</strong>继续玩——因为每次回来都 +1，智能体自己就会学会赖着不走。第二种更通用，本书采用它；代价是轨迹无限长且奖励为正，<strong>必须配折扣率</strong>——上一环的 γ 在这里再次登场。概念之间开始互相咬合了。',
      en: 'Episodic and continuing tasks unify: after reaching s9, either make it an <strong>absorbing state</strong> (only a5 allowed, or p(s9|s9,ai)=1), or treat it as a <strong>normal state</strong> — since each visit pays +1, the agent will learn to stay by itself. The second is more general and is the book\'s choice; the price is an infinite positive-reward trajectory, so the <strong>discount rate becomes mandatory</strong> — γ from the previous link re-enters. The concepts start interlocking.',
      question: '如果世界不是确定性的呢？' },
    { link: '引入随机性 · Randomness',
      title: { zh: '世界会掷骰子：条件概率接管一切', en: 'The world rolls dice: conditional probabilities take over' },
      zh: '风一吹，走 a2 可能到 s5 而不是 s2；努力学习有奖励，但分数有运气。确定性表格不够用了，通用语言是三个条件概率：<strong>p(s′|s,a)</strong> 转移、<strong>p(r|s,a)</strong> 奖励、<strong>π(a|s)</strong> 策略。确定性只是"概率 1"的特例——一套记号兼容所有情形。每个分布都必须归一化（和为 1），因为"总要去某个地方、总得某个奖励、总要选某个动作"。',
      en: 'A gust of wind may blow an a2-step to s5 instead of s2; studying hard pays, but grades have luck. Deterministic tables no longer suffice; the universal language is three conditional probabilities: <strong>p(s′|s,a)</strong> transitions, <strong>p(r|s,a)</strong> rewards, <strong>π(a|s)</strong> policies. Deterministic is just "probability 1" — one notation covers every case. Each distribution must normalise (sum to 1): you always land somewhere, earn something, and choose some action.',
      question: '这些零件如何组装成一个整体？' },
    { link: '组装 · Assembly',
      title: { zh: 'MDP：五件套 + 一条地基', en: 'The MDP: five parts plus one foundation' },
      zh: '把全部零件装进 <strong>MDP</strong>：集合（S, A(s), R(s,a)）+ 模型（p(s′|s,a), p(r|s,a)，合称 dynamics）+ 策略 π(a|s)，再加地基<strong>马尔可夫性</strong>：p(s_{t+1}|s_t,a_t, 历史) = p(s_{t+1}|s_t,a_t)——<strong>下一步只看现在，不看历史</strong>。模型还要求平稳（规律不随时间变）。策略一固定，MDP 立刻退化成马尔可夫链（MP）——下面 mp-lab 里游走的粒子就是它。',
      en: 'Assemble everything into an <strong>MDP</strong>: sets (S, A(s), R(s,a)) + model (p(s′|s,a), p(r|s,a), together the dynamics) + policy π(a|s), plus the foundation, the <strong>Markov property</strong>: p(s_{t+1}|s_t,a_t, history) = p(s_{t+1}|s_t,a_t) — <strong>the next step depends only on the present, not the past</strong>. The model is further assumed stationary. Fix the policy and the MDP immediately degenerates into a Markov chain — the wandering particle in the mp-lab.',
      question: '这条地基为什么非有不可？' },
    { link: '地基的意义 · Why it matters',
      title: { zh: '马尔可夫性 → 递归 → Bellman 方程', en: 'Markov property → recursion → the Bellman equation' },
      zh: '无记忆性让"未来"可以<strong>压缩进"现在"</strong>：从 s 出发的期望回报，等于"下一步的即时奖励 + 从下一个状态出发的期望回报（折扣后）"。这是一个<strong>递归</strong>——状态价值 V(s) 满足的方程就是 <strong>Bellman 方程</strong>，第 2 章的主角。没有马尔可夫性，"当前状态"就不包含足够信息，递归断掉，整个数学大厦无从建起。回头看：从"想要一个好策略"到"Bellman 方程"，每一步都由上一步逼出——这就是第一章的完整推理链。',
      en: 'Memorylessness lets the future be <strong>compressed into the present</strong>: the expected return from s equals the next immediate reward plus the discounted expected return from the next state. That is a <strong>recursion</strong> — the equation for the state value V(s) is the <strong>Bellman equation</strong>, protagonist of Chapter 2. Without the Markov property the current state would not carry enough information, the recursion would break, and the whole edifice could not stand. Looking back: from "we want a good policy" to "the Bellman equation", every step was forced by the previous one — that is the complete reasoning chain of Chapter 1.',
      question: null },
  ];

  /* ═══════════ Q&A ═══════════ */
  const qa = [
    {
      tag: 'Q1 · 书上原问', q: { zh: '可以把所有奖励都设成负数吗？那智能体还动得了吗？', en: 'Can all rewards be negative? Wouldn\'t the agent be paralyzed?' },
      a: { zh: '可以，完全不影响。<strong>起作用的是奖励的相对值，不是绝对值</strong>。把本章的 −1/−1/+1/0 整体加上 −2，得到 −3/−3/−1/−2——全是负数，但最优策略一模一样。因为最优策略对奖励的<strong>仿射变换不变</strong>（平移 + 缩放不改变谁比谁好），细节在第 3.5 节给出。直观理解：大家同时穷了，排名不变。', en: 'Yes, with no effect at all. <strong>What matters is relative, not absolute, reward values.</strong> Adding −2 to this chapter\'s −1/−1/+1/0 gives −3/−3/−1/−2 — all negative, yet the optimal policy is identical, because optimal policies are <strong>invariant to affine transformations</strong> of the rewards (details in Section 3.5). Intuition: if everyone becomes poorer together, the ranking never changes.' },
    },
    {
      tag: 'Q2 · 书上原问', q: { zh: '奖励到底依赖不依赖"下一个状态"？撞不撞墙明明是落地那一刻才知道的。', en: 'Does the reward depend on the next state? After all, you only learn what you hit upon landing.' },
      a: { zh: '本质上是依赖的：完整的描述是 p(r|s,a,s′)。但 s′ 本身由 (s,a) 概率地决定，所以可以把它<strong>边际化</strong>掉：p(r|s,a) = Σ_{s′} p(r|s,a,s′)·p(s′|s,a)。这样 r 就"只"是 (s,a) 的函数，记号简单一截——<strong>这样写的真正动机是让第 2 章的 Bellman 方程容易建立</strong>。数学上等价，工程上好写。', en: 'Essentially yes: the full description is p(r|s,a,s′). But s′ is itself generated from (s,a), so we can <strong>marginalise</strong> it out: p(r|s,a) = Σ_{s′} p(r|s,a,s′)·p(s′|s,a). Then r becomes a function of (s,a) only and the notation is much lighter — <strong>the real motive is that this makes the Bellman equation in Chapter 2 easy to establish</strong>. Mathematically equivalent, ergonomically superior.' },
    },
    {
      tag: 'Q3 · 代码补充', q: { zh: '为什么书上 s5 走 a2 会进入禁区 s6，老师代码里却被弹回 s5？', en: 'Why does the book let s5+a2 enter forbidden s6, while the teacher\'s code bounces back to s5?' },
      a: { zh: '这不是 bug，是<strong>课前与作业的约定不同</strong>。课件第 8 页写明：讲课采用"禁区可进入、进来挨罚"（更一般、更有挑战）；<strong>作业采用"禁区不可进入"</strong>——尝试进入会被弹回并罚 −1，这正是 <code class="inline">_get_next_state_and_reward</code> 里 <code class="inline">elif new_state in self.forbidden_states: x, y = state</code>（坐标不动）的含义。仿真任务里转移规则本来就是我们自己定义的——书上也说了：真实世界中，它由真实动力学决定。', en: 'Not a bug — a <strong>deliberate lecture-vs-assignment convention</strong>. Slide 8 states: lectures use "accessible but penalised" (more general and challenging); <strong>assignments use "inaccessible"</strong> — attempts bounce back with −1. That is exactly <code class="inline">elif new_state in self.forbidden_states: x, y = state</code> (coordinates unchanged). In a simulation we define the transition rules ourselves — the book says as much: in real-world applications they are determined by real-world dynamics.' },
    },
  ];

  /* ═══════════ 代码精讲 tabs ═══════════ */
  const codeFiles = [
    {
      id: 'init', file: 'grid_world.py — 类与 __init__', tab: '① 类与初始化',
      intro: { zh: '一切从 <code class="inline">class GridWorld()</code> 开始。<strong>类（class）</strong>是"图纸"，<code class="inline">env = GridWorld(...)</code> 按图纸盖出具体的"房子"（实例/对象）。<code class="inline">__init__</code> 是盖房时自动执行的装修工序：把环境尺寸、特殊格子、奖励数值、颜色全部登记为<strong>实例属性（self.xxx）</strong>——对象一辈子携带的随身档案。注意默认值来自 <code class="inline">args</code>（老师配置对象），所以"改作业参数"其实是改 args，而不是改类。', en: 'Everything starts from <code class="inline">class GridWorld()</code>. A <strong>class</strong> is a blueprint; <code class="inline">env = GridWorld(...)</code> builds a concrete house (instance) from it. <code class="inline">__init__</code> is the furnishing step that runs automatically at construction: it registers sizes, special cells, reward numbers and colours as <strong>instance attributes (self.xxx)</strong> — the object\'s lifelong dossier. Note the defaults come from <code class="inline">args</code> (the teacher\'s config object): adapting the assignment means patching args, not editing the class.' },
      code: srcInit,
      notes: [
        { lines: [8, 9], tag: 'import', zh: 'numpy 负责坐标运算，matplotlib 负责画图，patches 提供矩形/箭头等图形件。args 从 examples 包导入——这就是"配置与类分离"的架构。', en: 'numpy handles coordinate math, matplotlib draws, patches supplies rectangles/arrows. args is imported from the examples package — configuration and class are deliberately separated.' },
        { lines: [11, 15], tag: 'signature', zh: '参数默认值 <code class="inline">= args.env_size</code> 在"类被导入时"求值一次。若之后才改 args，默认参数不会跟着变——猴子补丁要在 import 后、实例化前完成（作业脚本正是这么干的）。', en: 'Default values like <code class="inline">= args.env_size</code> are evaluated once at class definition. Patching args later will NOT update them — monkey-patching must happen after import but before instantiation (exactly what the assignment script does).' },
        { lines: [17, 21], tag: 'state', zh: 'env_size 是 (列数, 行数) 元组；num_states = 列×行。start/target/forbidden 都是 (x, y) 元组，x 向右 y 向下，左上角是 (0,0)——注意和书上"从 1 数"的编号是两套语言。', en: 'env_size is a (cols, rows) tuple; num_states = cols × rows. start/target/forbidden are (x, y) tuples with x rightward, y downward and the top-left at (0,0) — a different language from the book\'s 1-based state indices.' },
        { lines: [23, 27], tag: 'rewards', zh: 'agent_state 是"当前智能体在哪"——环境唯一会变的记忆。奖励三件套从 args 读入：注意没有独立的 reward_boundary，撞墙复用了 reward_forbidden（作业里两者都是 −1，恰好无差别）。reward_step 对应书上 r_other（作业设为 0）。', en: 'agent_state is "where the agent is now" — the only mutable memory of the environment. The reward trio comes from args; note there is no separate reward_boundary — wall hits reuse reward_forbidden (both are −1 in the assignment, so no visible difference). reward_step corresponds to the book\'s r_other (set to 0 in the assignment).' },
        { lines: [33, 38], tag: 'colors', zh: 'RGB 三元组（0~1 浮点，matplotlib 惯例）：黄=禁区、蓝=目标、绿=策略箭头、绿线=轨迹、蓝星=智能体——和书上插图一致的配色方案。它们是"常量档案"，所以定义为类属性风格的自用常量。', en: 'RGB tuples in 0–1 floats (matplotlib convention): yellow = forbidden, blue = target, green = policy arrows, green line = trajectory, blue star = agent — matching the book\'s figures. They are immutable constants of the object.' },
      ],
    },
    {
      id: 'step', file: 'grid_world.py — reset 与 step', tab: '② 交互接口',
      intro: { zh: '<code class="inline">reset()</code> 与 <code class="inline">step(action)</code> 是整个环境仅有的两个"业务窗口"——所有强化学习算法（不管第 4 章还是第 10 章）都只通过这两个函数与世界打交道。<code class="inline">step</code> 返回经典的 gym 四元组 <code class="inline">(next_state, reward, done, info)</code>。', en: '<code class="inline">reset()</code> and <code class="inline">step(action)</code> are the environment\'s only two service windows — every RL algorithm, from Chapter 4 to Chapter 10, talks to the world exclusively through them. <code class="inline">step</code> returns the classic gym 4-tuple <code class="inline">(next_state, reward, done, info)</code>.' },
      code: srcStep,
      notes: [
        { lines: [1, 4], tag: 'reset', zh: '把智能体放回起点，<strong>新建</strong>轨迹列表 traj（首元素是起点坐标）。返回 (state, info) 双元组——info 是空字典，占位以兼容 gym 惯例。', en: 'Puts the agent back at the start and <strong>creates a fresh</strong> trajectory list traj whose first element is the start cell. Returns (state, info); the empty dict info is a placeholder for gym compatibility.' },
        { lines: [6, 7], tag: 'assert', zh: '<code class="inline">assert action in self.action_space</code>：防御式编程。动作必须是 action_space 里的元组（如 (1,0)），传错直接报错——把"非法输入"挡在门口。', en: '<code class="inline">assert action in self.action_space</code>: defensive programming. The action must be a tuple from action_space (e.g. (1,0)); bad input fails loudly at the gate.' },
        { lines: [9, 10], tag: 'delegate', zh: '真正干活的是带下划线的私有方法：<strong>计算</strong>与<strong>记录</strong>分离。下划线前缀是 Python 惯例——"这是内部零件，外部请走 step 窗口"。', en: 'The real work happens in the underscore-private method: computation and bookkeeping are separated. The underscore prefix is a Python convention meaning "internal part; outsiders use the step window".' },
        { lines: [12, 15], tag: 'jitter', zh: '这两行是纯美观设计：给轨迹点加 0.03 的随机抖动、再沿动作方向偏移 0.2，让绿线不至于完全重叠成一条直线。<code class="inline">np.random.randn()</code> 是标准正态随机数；<code class="inline">tuple(np.array(...) + 0.2*np.array(action))</code> 演示了 numpy 向量加法——元组先变数组，加完再变回元组。对环境逻辑零影响。', en: 'Purely cosmetic: each trajectory point gets 0.03 of Gaussian jitter plus a 0.2 offset along the action direction, so the green line does not overlap into one stroke. <code class="inline">np.random.randn()</code> is standard-normal noise; <code class="inline">tuple(np.array(...) + 0.2*np.array(action))</code> shows numpy vectorised addition — tuple to array, add, back to tuple. Zero effect on environment logic.' },
        { lines: [17, 21], tag: 'commit', zh: '先改状态、再追加两个轨迹点（抖动点+正式点），最后返回四元组。<strong>顺序不可乱</strong>：traj 的两个点必须与 agent_state 的更新配套，画图才能首尾相接。', en: 'Update the state, append two trajectory points (jittered + official), return the 4-tuple. <strong>Order matters</strong>: the two traj points must stay paired with the agent_state update or the drawn line will break.' },
      ],
    },
    {
      id: 'trans', file: 'grid_world.py — 转移与奖励（核心！）', tab: '③ 转移与奖励 ★',
      intro: { zh: '这是<strong>全文件最重要的一段</strong>：状态转移和奖励的完整规则，就是书上 Table 1.1 + Table 1.3 合起来的代码版。if/elif 长链的顺序大有讲究：先挡边界、再认目标、再挡禁区、最后普通移动。请对照下面的逐分支表格精读。', en: 'This is <strong>the most important passage of the file</strong>: the complete rules of transition and reward — the code form of the book\'s Tables 1.1 + 1.3 combined. The if/elif chain is order-sensitive: block the boundary first, then recognise the target, then block forbidden cells, and only then move normally. Study it branch by branch with the table below.' },
      code: srcTrans,
      notes: [
        { lines: [2, 3], tag: 'numpy add', zh: '<code class="inline">tuple(np.array(state) + np.array(action))</code>：状态和动作都是 (x,y) 元组，直接相加会变成"字符串拼接"般的错误，所以先各自转成 numpy 数组做向量加法，再转回元组。这是全文件最容易看不懂的一行——本质就是 (x+dx, y+dy)。', en: '<code class="inline">tuple(np.array(state) + np.array(action))</code>: state and action are (x,y) tuples; adding them as plain tuples would concatenate, so both become numpy arrays for vectorised addition, then back to tuple. The most cryptic line of the file — it is simply (x+dx, y+dy).' },
        { lines: [4, 15], tag: 'boundary ×4', zh: '四个边界分支长得像是有意为之的"笨"，其实等价于一个判断：目标坐标越界 → 原地不动 + 惩罚。注意三点：① 判断用的是"新坐标是否越界"，不是"当前是否在边缘"；② 坐标被钳制回边界值；③ 奖励用的是 <code class="inline">reward_forbidden</code>（老师把撞墙视为一种被禁止的行为；作业规定两者都是 −1 所以恰好一致）。', en: 'The four boundary branches look deliberately "dumb" but reduce to one test: target coordinates out of bounds → stay in place + penalty. Three details: ① the test is on the new coordinates, not on being at the edge; ② coordinates are clamped back to the border value; ③ the reward uses <code class="inline">reward_forbidden</code> (wall hits are treated as a forbidden behaviour; the assignment sets both to −1 so it matches).' },
        { lines: [16, 18], tag: 'target', zh: '<strong>到目标分支</strong>：只看 new_state 是否等于 target_state。命中则奖励 +1，坐标落在目标格。注意它排在禁区检查<strong>之前</strong>——顺序若颠倒，一个"既是目标又被标成禁区"的格子会出错。', en: '<strong>Target branch</strong>: checks only whether new_state equals target_state; on a hit, reward +1 and the coordinates land on the target. Note it comes <strong>before</strong> the forbidden check — reversing the order would corrupt a cell that is both target and forbidden.' },
        { lines: [19, 21], tag: 'forbidden ★', zh: '<strong>本作业最关键的一行</strong>：<code class="inline">x, y = state</code>（不是 new_state！）——禁区<strong>不可进入</strong>，尝试即被弹回原地，同时罚 −1。这就是课件第 8 页"作业采用情形二"的代码落点；书上的情形一（可进入）则应写 <code class="inline">x, y = new_state</code>。', en: '<strong>The single most assignment-relevant line</strong>: <code class="inline">x, y = state</code> (not new_state!) — forbidden cells are <strong>inaccessible</strong>; an attempt bounces back with −1. This is slide 8\'s "assignments use Scenario 2" in code; the book\'s Scenario 1 would instead write <code class="inline">x, y = new_state</code>.' },
        { lines: [22, 25], tag: 'else', zh: '普通移动：直接采用新坐标，奖励 reward_step（书上叫 r_other，作业里设为 0——走路免费）。整条链没有"进禁区后还继续"的路径——代码世界里禁区就是墙。', en: 'Normal move: take the new coordinates, reward reward_step (the book\'s r_other, set to 0 in the assignment — walking is free). Nowhere in the chain does an agent proceed into a forbidden cell — in this codebase, forbidden means wall.' },
        { lines: [27, 30], tag: '_is_done', zh: '<code class="inline">_is_done</code> 判断"是否到过目标"，返回布尔值。它只影响 step 返回的 done 标志，<strong>环境不会因此关机</strong>——这正是 §1.6"目标格按普通状态处理、过程可以无限继续"的实现。', en: '<code class="inline">_is_done</code> reports "visited the target" as a bool. It only sets the done flag in step\'s return; <strong>the environment never shuts down</strong> — exactly §1.6\'s "target as a normal state, process may continue forever".' },
      ],
    },
    {
      id: 'render', file: 'grid_world.py — render 画布', tab: '④ render 画图',
      intro: { zh: '<code class="inline">render()</code> 负责把环境画出来。它有一个精巧的设计：<strong>懒初始化</strong>——第一次调用才创建画布（if self.canvas is None），之后每次只更新星星位置和轨迹线。这也是"为什么 add_policy 必须在 render 之后"的原因：画布和 self.ax 都是 render 造出来的。', en: '<code class="inline">render()</code> draws the environment, with a neat design: <strong>lazy initialisation</strong> — the canvas is created on the first call (if self.canvas is None), afterwards only the star and the trajectory line are updated. This is also why add_policy must come after render: both the canvas and self.ax are born inside render.' },
      code: srcRender,
      notes: [
        { lines: [2, 4], tag: 'ion + subplots', zh: '<code class="inline">plt.ion()</code> 打开交互模式（持续重绘不阻塞）；<code class="inline">plt.subplots()</code> 一次性返回 (Figure, Axes) 二元组——Figure 是"画板"，Axes 是"画布区"，之后所有图形元素都挂在 self.ax 上。', en: '<code class="inline">plt.ion()</code> enables interactive mode (continuous redraws without blocking); <code class="inline">plt.subplots()</code> returns the (Figure, Axes) pair — the Figure is the board, the Axes the drawing area; every later element hangs on self.ax.' },
        { lines: [11, 11], tag: 'invert ★', zh: '<code class="inline">invert_yaxis()</code> 是理解整份代码坐标系的钥匙：数据坐标里 y 向下增大（屏幕习惯），反转 y 轴后画出来才和书上插图一致。作业里"s8 在第 2 行第 4 列"对应代码 (3,1)，画出来就是第 2 行第 4 列。', en: '<code class="inline">invert_yaxis()</code> is the key to the whole coordinate system: in data coordinates y grows downward (screen convention); flipping the axis makes the plot match the book\'s figures. "s8 on row 2, column 4" is code cell (3,1), drawn exactly there.' },
        { lines: [23, 32], tag: 'patches', zh: '<code class="inline">patches.Rectangle((x-0.5, y-0.5), 1, 1, ...)</code>：矩形用"左下角 + 宽高"定义，所以目标/禁区格子都要从中心 (x,y) 退半格到角 (x−0.5, y−0.5)，宽高各 1，恰好铺满一个格子。edgecolor/facecolor 同色 = 纯色填充。', en: '<code class="inline">patches.Rectangle((x-0.5, y-0.5), 1, 1, ...)</code>: rectangles are defined by corner + width/height, so target/forbidden cells start from the corner (x−0.5, y−0.5) — half a cell back from the centre — spanning exactly one cell. Matching edge/face colours give a solid fill.' },
        { lines: [34, 35], tag: 'line2d', zh: '<code class="inline">self.ax.plot([], [])</code> 先建"空线条"拿回句柄（注意逗号：解包 Line2D 对象），以后每帧用 <code class="inline">set_data</code> 改数据而不是重画——这是 matplotlib 动画的标准省时套路。星星 marker=\'*\' 就是智能体本尊。', en: '<code class="inline">self.ax.plot([], [])</code> first creates empty lines and keeps their handles (note the comma: unpacking the Line2D object); each frame then updates via <code class="inline">set_data</code> instead of redrawing — the standard matplotlib animation idiom. The star marker=\'*\' is the agent itself.' },
        { lines: [41, 44], tag: 'pause ★', zh: '<code class="inline">plt.draw()</code> 触发重绘，<code class="inline">plt.pause(interval)</code> 交出一帧时间。<strong>著名天坑</strong>：无窗口的 Agg 后端会把 pause(0) 当成"无限等待"，程序永远卡住——无头跑脚本时要把它换成 0.001 或直接 <code class="inline">plt.pause = lambda *a: None</code>。args.debug=True 时还会阻塞等回车，便于逐帧观察。', en: '<code class="inline">plt.draw()</code> triggers a repaint; <code class="inline">plt.pause(interval)</code> yields one frame. <strong>Famous pitfall</strong>: the windowless Agg backend interprets pause(0) as "wait forever" and the program hangs — when running headless, replace it with 0.001 or <code class="inline">plt.pause = lambda *a: None</code>. With args.debug=True it also waits for Enter so you can step through frames.' },
      ],
    },
    {
      id: 'policy', file: 'grid_world.py — add_policy / add_state_values', tab: '⑤ 策略与价值叠加',
      intro: { zh: '这两个方法是"作业报告专用画笔"：把策略矩阵画成箭头场、把价值数组写进格子。它们的输入都是 <strong>16×5 / 16 长度的数组</strong>，行序按状态编号 s1..s16（行优先），列序按 action_space（下、右、上、左、原地）。', en: 'These two methods are the "assignment-report brushes": they overlay a policy matrix as a field of arrows and write value numbers into cells. Their inputs are <strong>16×5 / length-16 arrays</strong>, rows in state order s1..s16 (row-major), columns in action_space order (down, right, up, left, still).' },
      code: srcPolicy,
      notes: [
        { lines: [3, 5], tag: 'index math', zh: '<code class="inline">x = state % 列数; y = state // 列数</code>：一维编号 → 二维坐标的通用公式（行优先展开的逆操作）。s8 → (3,1)：8%4=3，8//4=1。与书上的换算 s_i ↔ ((i−1)%4, (i−1)//4) 只差一个 1，因为这里 state 从 0 数。', en: '<code class="inline">x = state % cols; y = state // cols</code>: the universal 1-D index → 2-D coordinate formula (inverse of row-major flattening). s8 → (3,1): 8%4=3, 8//4=1. Identical to the book\'s s_i ↔ ((i−1)%4, (i−1)//4) up to the 1, because here state is 0-based.' },
        { lines: [7, 8], tag: 'skip zeros', zh: '概率为 0 的动作直接跳过不画——所以确定性策略每格只有一支箭头，随机策略每格可能有若干支。<code class="inline">enumerate(policy_matrix)</code> 同时给出行号（=状态）和整行概率。', en: 'Zero-probability actions are skipped — a deterministic policy shows one arrow per cell, a stochastic one may show several. <code class="inline">enumerate(policy_matrix)</code> yields the row index (= state) together with the full probability row.' },
        { lines: [9, 13], tag: 'FancyArrow', zh: '箭头长度公式 <code class="inline">0.1 + p/2</code>：<strong>概率越大箭头越长</strong>——底长 0.1、随概率伸长：p = 1 时长 0.6，p = 0.5 时长 0.35，看图就能读出相对大小。dx/dy 取自 action_space[i]，这正是"列序必须跟代码走"的原因：第 1 列是 (0,1)=向下。', en: 'Arrow length <code class="inline">0.1 + p/2</code>: a base of 0.1 plus p/2 — 0.6 long at p = 1, 0.35 at p = 0.5. <strong>Higher probability, longer arrow</strong>: relative magnitudes read straight off the picture. dx/dy come from action_space[i]: exactly why column order must follow the code — column 1 is (0,1) = down.' },
        { lines: [14, 16], tag: 'circle', zh: '第五个动作 (0,0)（原地）没有方向，画成<strong>空心小圆圈</strong>。作业图画出圆圈＝"该状态以概率 p 原地踏步"，不是 bug。', en: 'The fifth action (0,0) (stay) has no direction and is drawn as a <strong>hollow circle</strong>. In assignment figures a circle means "this state stays put with probability p" — not a bug.' },
        { lines: [24, 30], tag: 'values', zh: '<code class="inline">np.round(values, precision)</code> 先统一保留 1 位小数，再逐格写 <code class="inline">ax.text</code>。注意异常处理缺失：传入长度不足 16 的数组不会报错、只会少画——调试时发现"格子没数字"先查数组长度。', en: '<code class="inline">np.round(values, precision)</code> normalises to 1 decimal place before writing each cell with <code class="inline">ax.text</code>. Note the missing validation: a too-short array silently under-fills — if cells lack numbers, check the array length first.' },
      ],
    },
    {
      id: 'args', file: 'arguments.py — 配置中心', tab: '⑥ arguments 配置',
      intro: { zh: '<code class="inline">arguments.py</code> 是环境的"规格说明书"。它用标准库 <code class="inline">argparse</code> 建了一组命令行参数，然后<strong>立刻</strong>执行 <code class="inline">parser.parse_args()</code> 得到全局配置对象 <code class="inline">args</code>。GridWorld 在构造时读取它——所以它是"改作业参数"的唯一的合法入口。', en: '<code class="inline">arguments.py</code> is the environment\'s specification sheet. Using the standard <code class="inline">argparse</code> library it defines a set of command-line arguments, then <strong>immediately</strong> runs <code class="inline">parser.parse_args()</code> to produce the global config object <code class="inline">args</code>. GridWorld reads it at construction — making args the single legitimate entrance for adapting the assignment parameters.' },
      code: srcArgs,
      notes: [
        { lines: [5, 5], tag: 'argparse', zh: '<code class="inline">argparse</code> 本职是解析命令行参数；这里没传命令行，所以全部走 default 值。副作用是：import 这个模块的瞬间配置就定下来了——这就是"先 import args 再 import GridWorld、中间改属性"猴子补丁能生效的原因（模块缓存让所有人共享同一个 args）。', en: '<code class="inline">argparse</code> normally parses command-line arguments; with none given, all defaults apply. Side effect: the config freezes at the instant of import — which is why the monkey-patch "import args first, then GridWorld, mutating attributes in between" works (module caching shares one args with everyone).' },
        { lines: [8, 9], tag: 'env-size', zh: '默认 (5,5)——<strong>老师仓库默认 ≠ 作业要求</strong>。作业必须 4×4。type=Union[...] 只是给 IDE 看的类型提示，运行时不校验。', en: 'Default (5,5) — <strong>the repo default is NOT the assignment spec</strong>. The assignment requires 4×4. type=Union[...] is a hint for the IDE; nothing is validated at runtime.' },
        { lines: [17, 22], tag: 'rewards', zh: '默认奖励 10 / −5 / −1 是书里另一套设定，<strong>作业必须改成 +1 / −1 / 0</strong>（r_target / r_forbidden / r_step）。这套默认值常常是"图画对了、分扣了"的事故源头。', en: 'The defaults 10 / −5 / −1 follow the book\'s other setting; <strong>the assignment requires +1 / −1 / 0</strong> (r_target / r_forbidden / r_step). These defaults are a classic source of "the figure looked right but points were lost".' },
        { lines: [31, 33], tag: 'action-space ★', zh: '<strong>动作空间五元组</strong>，注释写明顺序：down, right, up, left, stay。它与书本 a1..a5 的顺序不同（书：up, right, down, left, still）——写策略矩阵时列序以此为准。<code class="inline">(0,1)</code> 是 (dx, dy)：x+1 向右、y+1 在屏幕坐标系里向下。', en: '<strong>The action-space 5-tuple</strong>, comment: down, right, up, left, stay — a different order from the book\'s a1..a5 (up, right, down, left, still); policy matrices must use THIS column order. <code class="inline">(0,1)</code> is (dx, dy): x+1 rightward, y+1 downward on screen.' },
        { lines: [48, 55], tag: 'validate', zh: '防御式校验：起点/目标/禁区都不能越界。注意这个函数在 import 时立即执行——配置错误会在"导入阶段"就爆炸，而不是等到画图。尽早失败（fail fast）是好习惯。', en: 'Defensive validation: start/target/forbidden must all lie inside the grid. It runs immediately at import — configuration errors explode at import time, not at drawing time. Fail fast is a virtue.' },
      ],
    },
    {
      id: 'main', file: 'example_grid_world.py — 交互循环', tab: '⑦ 交互循环',
      intro: { zh: '这是把所有零件串起来的"主程序"，也是<strong>每个 RL 算法骨架的雏形</strong>：reset → 循环{选动作 → step} → 收尾画图。把中间的 random.choice 换成任何学习算法，你就得到了第 4~10 章所有代码的骨架。', en: 'This main script wires every part together and is <strong>the embryo of every RL algorithm\'s skeleton</strong>: reset → loop {choose action → step} → final plotting. Replace random.choice with any learning algorithm and you have the skeleton of Chapters 4–10.' },
      code: srcMain,
      notes: [
        { lines: [2, 5], tag: 'path', zh: '<code class="inline">sys.path.append("..")</code> 把上级目录塞进模块搜索清单——没有它，<code class="inline">from src.grid_world import GridWorld</code> 会直接 ImportError。这就是作业脚本里 <code class="inline">sys.path.insert(0, REPO)</code> 的前身。', en: '<code class="inline">sys.path.append("..")</code> adds the parent folder to the module search path — without it <code class="inline">from src.grid_world import GridWorld</code> raises ImportError. It is the ancestor of the assignment script\'s <code class="inline">sys.path.insert(0, REPO)</code>.' },
        { lines: [9, 16], tag: 'loop', zh: '标准交互循环。<code class="inline">random.choice(env.action_space)</code> = 均匀随机策略（5 个动作各 1/5 概率）。打印里 <code class="inline">next_state+(np.array([1,1]))</code> 用 numpy 广播把 0 基坐标转成 1 基编号方便人读。<code class="inline">if done: break</code> 被注释掉——环境永不停止，呼应 §1.6 的 continuing task。', en: 'The standard interaction loop. <code class="inline">random.choice(env.action_space)</code> = uniform random policy (each action 1/5). In the print, <code class="inline">next_state+(np.array([1,1]))</code> uses numpy broadcasting to convert 0-based coordinates to 1-based numbers for humans. <code class="inline">if done: break</code> is commented out — the environment never stops, echoing §1.6\'s continuing task.' },
        { lines: [19, 21], tag: 'normalize ★', zh: '两行造出随机策略矩阵，非常值得背：<code class="inline">np.random.rand(16,5)</code> 造 16×5 的均匀随机数；<code class="inline">/= sum(axis=1)[:, np.newaxis]</code> 把每行除以自己的行和——<code class="inline">[:, np.newaxis]</code> 把行和变成 (16,1) 列向量以触发<strong>广播</strong>。这两行就是"合法策略矩阵"（每行和为 1）的万能构造法。', en: 'Two lines that build a random policy matrix — worth memorising: <code class="inline">np.random.rand(16,5)</code> makes uniform randoms; <code class="inline">/= sum(axis=1)[:, np.newaxis]</code> divides each row by its own sum — <code class="inline">[:, np.newaxis]</code> reshapes the sums into a (16,1) column to trigger <strong>broadcasting</strong>. This is the universal recipe for a valid (row-stochastic) policy matrix.' },
        { lines: [23, 28], tag: 'finish', zh: '收尾三连：叠加策略 → 叠加价值 → 以 2 秒间隔渲染最后一帧（足够长的 pause 让窗口停留）。<strong>顺序铁律</strong>：render 必须最先调用，因为画布由它创建。', en: 'The closing triple: overlay policy → overlay values → render one last frame with a 2-second interval (a long enough pause keeps the window alive). <strong>Iron order rule</strong>: render must be called first because it creates the canvas.' },
      ],
    },
  ];

  /* ═══════════ 转移分支逐条表（代码 if/elif） ═══════════ */
  const traceBranches = [
    { cond: 'y+1 > 行数−1 且 a=(0,1)', res: { zh: 'y 钳到底边，原地', en: 'clamp y, stay' }, rw: 'reward_forbidden', case: 'boundary ↓' },
    { cond: 'x+1 > 列数−1 且 a=(1,0)', res: { zh: 'x 钳到右边，原地', en: 'clamp x, stay' }, rw: 'reward_forbidden', case: 'boundary →' },
    { cond: 'y−1 < 0 且 a=(0,−1)', res: { zh: 'y 钳到顶边，原地', en: 'clamp y, stay' }, rw: 'reward_forbidden', case: 'boundary ↑' },
    { cond: 'x−1 < 0 且 a=(−1,0)', res: { zh: 'x 钳到左边，原地', en: 'clamp x, stay' }, rw: 'reward_forbidden', case: 'boundary ←' },
    { cond: 'new_state == target', res: { zh: '进入目标格', en: 'enter target' }, rw: 'reward_target', case: 'target' },
    { cond: 'new_state ∈ forbidden', res: { zh: '坐标不动（弹回原地）', en: 'keep coords (bounce back)' }, rw: 'reward_forbidden', case: 'forbidden' },
    { cond: 'else', res: { zh: '正常移动到新格', en: 'move normally' }, rw: 'reward_step', case: 'normal' },
  ];

  // 可变注册表：后续 data-lX.js 会往里追加小节/导航组，并标记完成
  const NAV = [
    { lecture: 1, label: 'L1 · 基本概念', items: [
      { id: 'grid-world',  zh: '网格世界',        en: 'Grid world · §1.1' },
      { id: 'state-action', zh: '状态与动作',      en: 'State & action · §1.2' },
      { id: 'transition',  zh: '状态转移',        en: 'Transition · §1.3' },
      { id: 'policy',      zh: '策略',            en: 'Policy · §1.4' },
      { id: 'reward',      zh: '奖励',            en: 'Reward · §1.5' },
      { id: 'trajectory',  zh: '轨迹·回报·回合',   en: 'Trajectory & return · §1.6' },
      { id: 'mdp',         zh: '马尔可夫决策过程', en: 'MDP · §1.7' },
      { id: 'summary',     zh: '本章总结',        en: 'Summary · §1.8' },
      { id: 'reasoning',   zh: '连贯长推理',      en: 'The long reasoning' },
      { id: 'code',        zh: '代码精讲',        en: 'Code walkthrough' },
      { id: 'qa',          zh: '问答',            en: 'Q&A · §1.9' },
    ]},
  ];

  const LECTURES = [
    { no: 1, zh: '基本概念', en: 'Basic concepts', done: true },
    { no: 2, zh: '状态价值与 Bellman 方程', en: 'Bellman equation' },
    { no: 3, zh: 'Bellman 最优方程', en: 'Bellman optimality' },
    { no: 4, zh: '值迭代与策略迭代', en: 'VI & PI' },
    { no: 5, zh: '蒙特卡洛方法', en: 'Monte Carlo' },
    { no: 6, zh: '随机近似', en: 'Stochastic approx.' },
    { no: 7, zh: '时序差分方法', en: 'Temporal-difference' },
    { no: 8, zh: '值函数近似', en: 'Value function approx.' },
    { no: 9, zh: '策略梯度方法', en: 'Policy gradient' },
    { no: 10, zh: 'Actor-Critic', en: 'Actor-Critic' },
  ];

  return {
    actions: BOOK_ACTIONS, T3, R3SYM, P1, P2, PS, TRAJ1, TRAJ2, A4,
    reasoning, qa, codeFiles, traceBranches,
    langModes: [
      { key: 'both', label: '双语' },
      { key: 'zh', label: '中文' },
      { key: 'en', label: 'EN' },
    ],
    navGroups: NAV,
    otherLectures: LECTURES,
    sections: S,
  };
})();

/* ═══════════════════════════════════════════════════════════
   三层导航 · navClusters（讲 → 子主题组 → 小节）
   key = 讲座号。items 是该讲 navGroups 里已有的小节 id，
   仅作分组视图：每讲全部小节恰好出现一次，无遗漏、无多余、无重复。
   ═══════════════════════════════════════════════════════════ */
window.DATA.navClusters = {
  1: [
    { zh: '认识世界', en: 'The world', items: ['grid-world', 'state-action', 'transition'] },
    { zh: '决策要素', en: 'Decision ingredients', items: ['policy', 'reward', 'trajectory'] },
    { zh: '过程与框架', en: 'Process & framework', items: ['mdp', 'summary'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['reasoning', 'code', 'qa'] },
  ],
  2: [
    { zh: '为什么要价值', en: 'Why values', items: ['l2-why', 'l2-bootstrap'] },
    { zh: '状态价值与方程', en: 'State values & the equation', items: ['l2-state-value', 'l2-bellman', 'l2-examples'] },
    { zh: '求解与动作价值', en: 'Solving & action values', items: ['l2-matrix', 'l2-solving', 'l2-action-value'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l2-summary', 'l2-reasoning', 'l2-code', 'l2-qa'] },
  ],
  3: [
    { zh: '从改进到最优', en: 'From improvement to optimality', items: ['l3-improve', 'l3-definition'] },
    { zh: 'BOE 与压缩映射', en: 'The BOE & contraction', items: ['l3-boe', 'l3-contraction', 'l3-solving'] },
    { zh: '旋钮与谜题', en: 'Knobs & puzzles', items: ['l3-factors', 'l3-detour'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l3-summary', 'l3-reasoning', 'l3-code', 'l3-qa'] },
  ],
  4: [
    { zh: '两大迭代', en: 'Two iterations', items: ['l4-vi', 'l4-pi', 'l4-truncated'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l4-summary', 'l4-reasoning', 'l4-code', 'l4-qa'] },
  ],
  5: [
    { zh: '从均值到 MC', en: 'From means to MC', items: ['l5-mean', 'l5-basic'] },
    { zh: '探索与利用', en: 'Exploration & exploitation', items: ['l5-exploring', 'l5-eps'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l5-summary', 'l5-reasoning', 'l5-code', 'l5-qa'] },
  ],
  6: [
    { zh: '随机近似主线', en: 'The SA backbone', items: ['l6-incremental', 'l6-rm', 'l6-sgd'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l6-summary', 'l6-reasoning', 'l6-code', 'l6-qa'] },
  ],
  7: [
    { zh: 'TD 家族', en: 'The TD family', items: ['l7-td0', 'l7-sarsa', 'l7-nstep'] },
    { zh: 'Q-learning 与统一视角', en: 'Q-learning & the unified view', items: ['l7-qlearning', 'l7-unified'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l7-summary', 'l7-reasoning', 'l7-code', 'l7-qa'] },
  ],
  8: [
    { zh: '从表格到函数', en: 'From table to function', items: ['l8-representation', 'l8-td-fa'] },
    { zh: '换引擎与 DQN', en: 'New engines & DQN', items: ['l8-q-fa', 'l8-dqn'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l8-summary', 'l8-reasoning', 'l8-code', 'l8-qa'] },
  ],
  9: [
    { zh: '策略与度量', en: 'Policy & metrics', items: ['l9-representation', 'l9-metrics'] },
    { zh: '定理与算法', en: 'Theorem & algorithm', items: ['l9-theorem', 'l9-reinforce'] },
    { zh: '本章工具箱', en: 'Chapter toolbox', items: ['l9-summary', 'l9-reasoning', 'l9-code', 'l9-qa'] },
  ],
  10: [
    { zh: 'AC 家族', en: 'The AC family', items: ['l10-qac', 'l10-a2c', 'l10-offpolicy'] },
    { zh: '收官工具箱', en: 'Finale toolbox', items: ['l10-summary', 'l10-reasoning', 'l10-code', 'l10-qa'] },
  ],
};
