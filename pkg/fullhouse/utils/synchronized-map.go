package utils

import "sync"

type SynchronizedMap[K, V comparable] struct {
	values map[K]V
	mutex  sync.RWMutex
}

func NewSynchronizedMap[K, V comparable]() SynchronizedMap[K, V] {
	return SynchronizedMap[K, V]{
		values: make(map[K]V),
		mutex:  sync.RWMutex{},
	}
}

func (m *SynchronizedMap[K, V]) Get(key K) (V, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	v, ok := m.values[key]
	return v, ok
}

func (m *SynchronizedMap[K, V]) Put(key K, value V) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.values[key] = value
}

func (m *SynchronizedMap[K, V]) Delete(key K) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.values, key)
}

func (m *SynchronizedMap[K, V]) Range(f func(key K, value V) bool) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for v, k := range m.values {
		if !f(v, k) {
			break
		}
	}
}
